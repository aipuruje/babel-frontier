// BKTEngine - Bayesian Knowledge Tracing (Lightweight)
// Updates skill mastery based on task performance

import type { BrainPack } from "./types";

export interface BKTParams {
    p_learn: number;      // Probability of learning when correct (0.08)
    p_guess: number;      // Probability of guessing correctly (0.2)
    p_slip: number;       // Probability of slipping when learned (0.1)
    decay_per_day: number; // Daily decay rate (0.01)
}

export class BKTEngine {
    private params: BKTParams;

    constructor(brainPack?: BrainPack) {
        // Load params from Brain Pack or use defaults
        this.params = brainPack?.learner_model.update_rules.mastery_update.params || {
            p_learn: 0.08,
            p_guess: 0.2,
            p_slip: 0.1,
            decay_per_day: 0.01,
        };
    }

    /**
     * Update mastery probability based on task outcome
     * 
     * Algorithm:
     * 1. If correct: P(learned | correct) = P(learned) + (1 - P(learned)) * p_learn
     * 2. If incorrect: P(learned | wrong) = P(learned) * (1 - p_slip)
     * 
     * Intuition:
     * - Correct answer increases belief that skill is learned
     * - Wrong answer decreases belief (either never learned or slipped)
     * - Bounded between 0.0 and 1.0
     */
    updateMastery(
        currentMastery: number,
        isCorrect: boolean,
        params?: Partial<BKTParams>
    ): number {
        const p = { ...this.params, ...params };

        let newMastery: number;

        if (isCorrect) {
            // Correct answer: increase probability
            // Account for guessing: P(correct | not learned) = p_guess
            // Use Bayes' rule to update P(learned | correct)
            const pCorrect = currentMastery * (1 - p.p_slip) + (1 - currentMastery) * p.p_guess;
            const pLearnedGivenCorrect = (currentMastery * (1 - p.p_slip)) / pCorrect;

            // Add learning gain
            newMastery = pLearnedGivenCorrect + (1 - pLearnedGivenCorrect) * p.p_learn;
        } else {
            // Wrong answer: decrease probability
            // Could be: (1) never learned, or (2) learned but slipped
            newMastery = currentMastery * (1 - p.p_slip);
        }

        // Clamp to [0.0, 1.0]
        return Math.max(0.0, Math.min(1.0, newMastery));
    }

    /**
     * Apply time-based decay to mastery
     * Skills decay if not practiced
     */
    applyDecay(currentMastery: number, daysSinceLastPractice: number): number {
        const decayFactor = Math.pow(1 - this.params.decay_per_day, daysSinceLastPractice);
        return currentMastery * decayFactor;
    }

    /**
     * Batch update mastery for multiple tasks
     */
    updateBatch(
        currentMastery: number,
        results: boolean[]
    ): number {
        let mastery = currentMastery;

        for (const isCorrect of results) {
            mastery = this.updateMastery(mastery, isCorrect);
        }

        return mastery;
    }

    /**
     * Predict probability of correct answer given current mastery
     */
    predictCorrect(mastery: number): number {
        return mastery * (1 - this.params.p_slip) + (1 - mastery) * this.params.p_guess;
    }

    /**
     * Estimate difficulty match (0.0 = too easy, 1.0 = perfect, >1.0 = too hard)
     * Target: P(correct) ≈ 0.7 for flow state
     */
    getDifficultyMatch(mastery: number): number {
        const pCorrect = this.predictCorrect(mastery);
        const targetP = 0.7;

        // How far from target? (0-1 scale)
        return 1.0 - Math.abs(pCorrect - targetP) / targetP;
    }
}

/**
 * Map task type to skill(s)
 */
export function getTaskSkills(taskType: string): string[] {
    const skillMap: Record<string, string[]> = {
        // Reading
        'READ_MCQ': ['comprehension_reading', 'language_vocab'],
        'READ_MATCH': ['comprehension_reading', 'language_grammar'],
        'RUNE_SCAN': ['comprehension_reading'],

        // Listening
        'LISTEN_MCQ': ['comprehension_listening', 'language_vocab'],
        'LISTEN_CLOZE': ['comprehension_listening', 'language_grammar'],
        'ECHO_HUNT': ['comprehension_listening'],

        // Grammar
        'CLOZE': ['language_grammar'],
        'MCQ': ['language_grammar', 'language_vocab'],
        'SPELL_FORGE': ['language_grammar'],

        // Writing
        'SHORT_TEXT': ['production_writing', 'language_grammar'],
        'WRITE_SHORT': ['production_writing'],
        'TRADE_PACT': ['production_writing'],

        // Speaking
        'SPEAK': ['production_speaking', 'language_vocab'],
        'SPEAK_SHORT': ['production_speaking'],
        'GATE_SPEAK': ['production_speaking'],
    };

    return skillMap[taskType] || ['language_grammar']; // Default fallback
}
