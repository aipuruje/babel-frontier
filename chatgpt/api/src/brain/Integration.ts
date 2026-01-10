// Integration module - Connects all Brain Pack components
// Call this after quest submission to update learner state

import type { Env } from "../index";
import type { LearnerState } from "./types";
import { getLearnerState, saveLearnerState } from "./LearnerState";
import { BKTEngine, getTaskSkills } from "./BKTEngine";
import { FatigueManager, getRageQuitCount24h } from "./FatigueManager";
import { ErrorFingerprintManager, extractErrorTags } from "./ErrorFingerprint";
import { brainPackLoader } from "./BrainPackLoader";

export interface QuestResult {
    questId: string;
    userId: string;
    taskResults: TaskResult[];
    timeSpentMs: number;
    win: boolean;
}

export interface TaskResult {
    taskId: string;
    taskType: string;
    isCorrect: boolean;
    expected: Record<string, unknown>;
    userAnswer: unknown;
}

/**
 * Main integration function: Update learner state after quest
 */
export async function updateLearnerStateAfterQuest(
    env: Env,
    result: QuestResult
): Promise<LearnerState> {
    // Load current state and brain pack
    const state = await getLearnerState(env, result.userId);
    const brainPack = await brainPackLoader.load(env);

    // Initialize engines
    const bktEngine = new BKTEngine(brainPack);
    const fatigueManager = new FatigueManager(brainPack);
    const errorManager = new ErrorFingerprintManager();

    // 1. Update skill mastery using BKT
    const updatedMastery = { ...state.mastery };

    for (const taskResult of result.taskResults) {
        const skills = getTaskSkills(taskResult.taskType);

        for (const skill of skills) {
            const currentMastery = updatedMastery[skill as keyof typeof updatedMastery];
            const newMastery = bktEngine.updateMastery(currentMastery, taskResult.isCorrect);
            updatedMastery[skill as keyof typeof updatedMastery] = newMastery;
        }
    }

    // 2. Update error fingerprint
    let updatedFingerprint = state.errorFingerprint;

    for (const taskResult of result.taskResults) {
        const errorTags = extractErrorTags(
            taskResult.taskType,
            taskResult.expected,
            taskResult.userAnswer,
            taskResult.isCorrect
        );

        updatedFingerprint = errorManager.addErrors(updatedFingerprint, errorTags);
    }

    // Apply decay to old errors
    updatedFingerprint = errorManager.applyDecay(updatedFingerprint);

    // 3. Update fatigue
    const errorCount = result.taskResults.filter(t => !t.isCorrect).length;
    const totalTasks = result.taskResults.length;
    const timeSpentMinutes = result.timeSpentMs / (1000 * 60);
    const isLateNight = fatigueManager.isLateNight();
    const rageQuitCount = await getRageQuitCount24h(env, result.userId);

    const newFatigue = fatigueManager.calculateAfterTask(
        state.fatigue,
        timeSpentMinutes,
        errorCount,
        totalTasks,
        isLateNight
    );

    const fatigueState = fatigueManager.getState(newFatigue, rageQuitCount);

    // 4. Build updated state
    const updatedState: LearnerState = {
        ...state,
        mastery: updatedMastery,
        errorFingerprint: updatedFingerprint,
        fatigue: fatigueState.current,
        attentionDropProbability: fatigueState.attentionDropProbability,
        recommendedSessionMinutes: fatigueState.recommendedSessionMinutes,
        updatedAt: new Date().toISOString(),
    };

    // 5. Save to database
    await saveLearnerState(env, updatedState);

    return updatedState;
}

/**
 * Apply offline recovery (called on session start)
 */
export async function applyOfflineRecovery(
    env: Env,
    userId: string
): Promise<LearnerState> {
    const state = await getLearnerState(env, userId);
    const brainPack = await brainPackLoader.load(env);

    const fatigueManager = new FatigueManager(brainPack);
    const bktEngine = new BKTEngine(brainPack);
    const errorManager = new ErrorFingerprintManager();

    // Calculate hours offline
    const lastActive = new Date(state.updatedAt);
    const now = new Date();
    const hoursOffline = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

    // Apply fatigue recovery
    const recoveredFatigue = fatigueManager.calculateRecovery(state.fatigue, hoursOffline);

    // Apply skill decay (if more than 1 day offline)
    let updatedMastery = state.mastery;
    if (hoursOffline > 24) {
        const daysOffline = hoursOffline / 24;

        updatedMastery = {
            comprehension_reading: bktEngine.applyDecay(state.mastery.comprehension_reading, daysOffline),
            comprehension_listening: bktEngine.applyDecay(state.mastery.comprehension_listening, daysOffline),
            language_grammar: bktEngine.applyDecay(state.mastery.language_grammar, daysOffline),
            language_vocab: bktEngine.applyDecay(state.mastery.language_vocab, daysOffline),
            production_writing: bktEngine.applyDecay(state.mastery.production_writing, daysOffline),
            production_speaking: bktEngine.applyDecay(state.mastery.production_speaking, daysOffline),
        };
    }

    // Apply error fingerprint decay
    const decayedFingerprint = errorManager.applyDecay(state.errorFingerprint);

    const updatedState: LearnerState = {
        ...state,
        mastery: updatedMastery,
        errorFingerprint: decayedFingerprint,
        fatigue: recoveredFatigue,
        attentionDropProbability: fatigueManager.getState(recoveredFatigue).attentionDropProbability,
        recommendedSessionMinutes: fatigueManager.getState(recoveredFatigue).recommendedSessionMinutes,
        updatedAt: now.toISOString(),
    };

    await saveLearnerState(env, updatedState);

    return updatedState;
}
