import type { Env } from "../index";
import { getQuestJson, listCanonQuestIds, markCompleted, recordAttempt, applyRewards } from "../utils/db";
import { brainPackLoader } from "../brain/BrainPackLoader";
import { getLearnerState } from "../brain/LearnerState";
import { PolicyEngine } from "../brain/PolicyEngine";
import { applyOfflineRecovery } from "../brain/Integration";

export interface Quest {
  id: string;
  template?: string;
  difficulty?: number;
  tasks?: Array<{
    id: string;
    type: string;
    scoring?: { maxPoints?: number };
    expected?: Record<string, unknown>;
    media?: {
      audio_r2_key?: string;
      image_r2_key?: string;
    };
  }>;
  rewards?: {
    xp?: number;
    shards?: number;
    items?: string[];
  };
}

export async function pickNextQuest(env: Env, userId: string): Promise<{ quest: Quest | null; reason?: string }> {
  // Load brain pack and learner state
  const brainPack = await brainPackLoader.load(env);
  const learnerState = await getLearnerState(env, userId);

  // Apply offline recovery (fatigue recovery + skill decay)
  await applyOfflineRecovery(env, userId);

  // Get all available quests
  const canonIds = await listCanonQuestIds(env);
  const availableQuests: Quest[] = [];

  for (const id of canonIds) {
    const quest = await getQuestJson(env, id);
    if (quest) {
      availableQuests.push(quest as Quest);
    }
  }

  if (availableQuests.length === 0) {
    return { quest: null };
  }

  // Use PolicyEngine for AI-driven quest selection
  const policyEngine = new PolicyEngine(brainPack);

  // Determine time of day (Tashkent time: UTC+5)
  const now = new Date();
  const tashkentHour = (now.getUTCHours() + 5) % 24;
  let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  if (tashkentHour >= 6 && tashkentHour < 12) timeOfDay = 'morning';
  else if (tashkentHour >= 12 && tashkentHour < 18) timeOfDay = 'afternoon';
  else if (tashkentHour >= 18 && tashkentHour < 23) timeOfDay = 'evening';
  else timeOfDay = 'night';

  const decision = policyEngine.selectNextQuest({
    learnerState,
    availableQuests,
    timeOfDay,
    deviceClass: learnerState.deviceConstraints.deviceClass,
  });

  const selectedQuest = await getQuestJson(env, decision.questId);

  return {
    quest: selectedQuest as Quest,
    reason: decision.reason,
  };
}

type SubmitPayload = {
  questId: string;
  answers: Record<string, unknown>;
  timeSpentMs?: number;
};

interface SubmitResult {
  ok: boolean;
  questId: string;
  score: number;
  maxScore: number;
  win: boolean;
  errors: Array<Record<string, unknown>>;
  rewards: {
    xp: number;
    shards: number;
    items: string[];
  };
}

export async function submitQuest(env: Env, userId: string, payload: SubmitPayload): Promise<SubmitResult> {
  const quest = await getQuestJson(env, payload.questId);
  if (!quest) throw new Error("Quest not found");

  const { score, maxScore, errors } = scoreQuest(quest, payload.answers || {});
  await recordAttempt(env, userId, payload.questId, score, maxScore, errors, payload.timeSpentMs ?? 0);

  const win = score >= Math.max(1, Math.floor(maxScore * 0.6));
  if (win) await markCompleted(env, userId, payload.questId);

  const xpGain = win ? (quest?.rewards?.xp ?? 0) : Math.floor((quest?.rewards?.xp ?? 0) * 0.25);
  const itemIds: string[] = (win ? (quest?.rewards?.items ?? []) : []);
  await applyRewards(env, userId, xpGain, itemIds.map(id => ({ itemId: id, qty: 1 })));

  return {
    ok: true,
    questId: payload.questId,
    score,
    maxScore,
    win,
    errors,
    rewards: {
      xp: xpGain,
      shards: win ? (quest?.rewards?.shards ?? 0) : 0,
      items: itemIds
    }
  };
}

function scoreQuest(quest: Quest, answers: Record<string, unknown>) {
  let score = 0;
  let maxScore = 0;
  const errors: Array<Record<string, unknown>> = [];

  for (const task of (quest.tasks ?? [])) {
    const max = Number(task?.scoring?.maxPoints ?? 0);
    maxScore += max;

    const taskId = task.id;
    const given = answers[taskId];

    const type = task.type;
    const expected = task.expected;

    if (type === "MCQ" || type === "CLOZE" || type === "READ_MCQ" || type === "LISTEN_MCQ") {
      const expectedChoice = expected?.choiceId;
      const got = typeof given === "string" ? given : given?.choiceId;
      if (got && expectedChoice && got === expectedChoice) {
        score += max;
      } else {
        errors.push({ taskId, type, expected: expectedChoice, got });
      }
      continue;
    }

    if (type === "READ_MATCH") {
      const exp = expected?.pairs ?? {};
      const gotPairs = given?.pairs ?? {};
      const keys = Object.keys(exp);
      const per = keys.length ? max / keys.length : 0;
      let gotPts = 0;
      for (const k of keys) {
        if (String(gotPairs[k]) === String(exp[k])) gotPts += per;
      }
      score += Math.round(gotPts);
      if (gotPts < max) errors.push({ taskId, type, expected: exp, got: gotPairs });
      continue;
    }

    // Subjective types (AI later): give partial credit in MVP
    score += Math.floor(max * 0.7);
  }

  return { score, maxScore, errors };
}
