import type { Env } from "../index";
import { getQuestJson, listCanonQuestIds, hasCompleted, markCompleted, recordAttempt, applyRewards } from "../utils/db";

export async function pickNextQuest(env: Env, userId: string): Promise<{ quest: any }> {
  const ids = await listCanonQuestIds(env);
  for (const id of ids) {
    const done = await hasCompleted(env, userId, id);
    if (!done) {
      const quest = await getQuestJson(env, id);
      if (!quest) throw new Error("Quest not found: " + id);
      return { quest };
    }
  }
  const quest = await getQuestJson(env, "Q001");
  if (!quest) throw new Error("Quest not found: Q001");
  return { quest };
}

type SubmitPayload = {
  questId: string;
  answers: Record<string, any>;
  timeSpentMs?: number;
};

export async function submitQuest(env: Env, userId: string, payload: SubmitPayload): Promise<any> {
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

function scoreQuest(quest: any, answers: Record<string, any>) {
  let score = 0;
  let maxScore = 0;
  const errors: any[] = [];

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
