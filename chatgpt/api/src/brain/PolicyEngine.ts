// PolicyEngine - AI-driven quest selection using contextual bandit
// Implements Brain Pack personalization_policy

import type { BrainPack, LearnerState } from "./types";
import type { Quest } from "../game/game";
import { BKTEngine } from "./BKTEngine";
import { ErrorFingerprintManager } from "./ErrorFingerprint";

export interface QuestSelectionContext {
    learnerState: LearnerState;
    availableQuests: Quest[];
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    deviceClass: string;
}

export interface QuestDecision {
    questId: string;
    reason: string;
    explorationFlag: boolean;
    predictedDifficulty: number;
    skillTargets: string[];
}

export class PolicyEngine {
    private brainPack: BrainPack;
    private bktEngine: BKTEngine;
    private errorManager: ErrorFingerprintManager;
    private epsilon: number; // Exploration rate

    constructor(brainPack: BrainPack) {
        this.brainPack = brainPack;
        this.bktEngine = new BKTEngine(brainPack);
        this.errorManager = new ErrorFingerprintManager();

        // Load exploration epsilon from brain pack
        this.epsilon = brainPack.personalization_policy.quest_selection.exploration.epsilon;
    }

    /**
     * Select next quest using contextual bandit algorithm
     */
    selectNextQuest(context: QuestSelectionContext): QuestDecision {
        const { learnerState, availableQuests } = context;

        // Apply constraints first
        const eligibleQuests = this.applyConstraints(availableQuests, context);

        if (eligibleQuests.length === 0) {
            throw new Error("No eligible quests available after constraints");
        }

        // Epsilon-greedy: Explore vs Exploit
        const shouldExplore = Math.random() < this.epsilon;

        if (shouldExplore) {
            // EXPLORATION: Random quest
            const randomQuest = eligibleQuests[Math.floor(Math.random() * eligibleQuests.length)];
            return {
                questId: randomQuest.id,
                reason: "exploration_random",
                explorationFlag: true,
                predictedDifficulty: this.estimateDifficulty(randomQuest, learnerState),
                skillTargets: this.getQuestSkills(randomQuest),
            };
        }

        // EXPLOITATION: Best quest based on policy
        const scoredQuests = eligibleQuests.map(quest => ({
            quest,
            score: this.scoreQuest(quest, learnerState),
        }));

        // Sort by score (highest first)
        scoredQuests.sort((a, b) => b.score - a.score);

        const bestQuest = scoredQuests[0].quest;

        return {
            questId: bestQuest.id,
            reason: this.explainBestChoice(bestQuest, learnerState),
            explorationFlag: false,
            predictedDifficulty: this.estimateDifficulty(bestQuest, learnerState),
            skillTargets: this.getQuestSkills(bestQuest),
        };
    }

    /**
     * Apply Brain Pack constraints to filter quests
     */
    private applyConstraints(
        quests: Quest[],
        context: QuestSelectionContext
    ): Quest[] {
        const { learnerState, deviceClass } = context;
        const constraints = this.brainPack.personalization_policy.quest_selection.constraints;

        return quests.filter(quest => {
            // Constraint 1: Max difficulty jump
            const currentAvgMastery = this.getAverageMastery(learnerState);
            const questDifficulty = quest.difficulty || 1;
            const expectedDifficulty = Math.round(currentAvgMastery * 10);

            if (Math.abs(questDifficulty - expectedDifficulty) > constraints.max_difficulty_jump) {
                return false;
            }

            // Constraint 2: No PvP if low mastery
            const isPvP = quest.template === 'arena_pvp_micro_duel';
            if (isPvP && currentAvgMastery < constraints.no_more_than_pvp_if_low_mastery) {
                return false;
            }

            // Constraint 3: Force review if error repeats 3x
            const reviewTargets = this.errorManager.getReviewTargets(learnerState.errorFingerprint);
            if (reviewTargets.length > 0) {
                // Prefer quests that target these errors
                // (Don't filter out, just boost in scoring)
            }

            // Constraint 4: Low-end device - disallow heavy assets
            if (constraints.low_end_device_disallow_heavy_assets && deviceClass === 'android_low') {
                const hasHeavyAssets = quest.tasks?.some(task =>
                    task.media?.audio_r2_key || task.media?.image_r2_key
                ) || false;

                if (hasHeavyAssets) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Score a quest for the current learner state
     * Higher score = better match
     */
    private scoreQuest(
        quest: Quest,
        learnerState: LearnerState
    ): number {
        let score = 0;

        // Factor 1: Skill alignment with weak areas (40% weight)
        const skillAlignmentScore = this.scoreSkillAlignment(quest, learnerState);
        score += skillAlignmentScore * 0.4;

        // Factor 2: Difficulty match (30% weight)
        const difficultyMatchScore = this.scoreDifficultyMatch(quest, learnerState);
        score += difficultyMatchScore * 0.3;

        // Factor 3: Error fingerprint targeting (20% weight)
        const errorTargetingScore = this.scoreErrorTargeting(quest, learnerState);
        score += errorTargetingScore * 0.2;

        // Factor 4: Variety / Anti-boredom (10% weight)
        const varietyScore = this.scoreVariety();
        score += varietyScore * 0.1;

        return score;
    }

    /**
     * Score how well quest targets weak skills
     */
    private scoreSkillAlignment(quest: Quest, learnerState: LearnerState): number {
        const questSkills = this.getQuestSkills(quest);
        const mastery = learnerState.mastery;

        // Get average mastery for skills this quest targets
        const skillMasteries = questSkills.map(skill =>
            mastery[skill as keyof typeof mastery] || 0.5
        );

        const avgMastery = skillMasteries.reduce((a, b) => a + b, 0) / skillMasteries.length;

        // Lower mastery = higher score (target weak areas)
        // Invert: 1.0 - mastery, so 0.0 mastery → 1.0 score
        return 1.0 - avgMastery;
    }

    /**
     * Score difficulty match to current ability
     * Target: P(correct) ≈ 0.7 for flow state
     */
    private scoreDifficultyMatch(quest: Quest, learnerState: LearnerState): number {
        const questSkills = this.getQuestSkills(quest);
        const mastery = learnerState.mastery;

        // Get average mastery for quest skills
        const skillMasteries = questSkills.map(skill =>
            mastery[skill as keyof typeof mastery] || 0.5
        );
        const avgMastery = skillMasteries.reduce((a, b) => a + b, 0) / skillMasteries.length;

        // Use BKT to predict P(correct)
        const pCorrect = this.bktEngine.predictCorrect(avgMastery);

        // Target P(correct) = 0.7 (flow state)
        const targetP = 0.7;
        const distance = Math.abs(pCorrect - targetP);

        // Convert distance to score (0-1 scale)
        return 1.0 - Math.min(distance / targetP, 1.0);
    }

    /**
     * Score how well quest targets error fingerprint
     */
    private scoreErrorTargeting(quest: Quest, learnerState: LearnerState): number {
        const reviewTargets = this.errorManager.getReviewTargets(learnerState.errorFingerprint);

        if (reviewTargets.length === 0) {
            return 0.5; // Neutral if no errors to target
        }

        // Check if quest template matches error types
        // (Simplified - in production, would map quest→error tags)
        const questTemplate = quest.template;
        const targetsGrammar = ['SPELL_FORGE', 'ruins_cloze_grammar'].includes(questTemplate);
        const targetsVocab = ['gate_riddle_vocab'].includes(questTemplate);
        const targetsListening = ['market_dialogue_listen', 'ECHO_HUNT'].includes(questTemplate);

        const hasGrammarErrors = reviewTargets.some(tag =>
            tag.includes('grammar') || tag.includes('articles') || tag.includes('tense')
        );
        const hasVocabErrors = reviewTargets.some(tag => tag.includes('vocab'));
        const hasListeningErrors = reviewTargets.some(tag => tag.includes('listening'));

        if ((targetsGrammar && hasGrammarErrors) ||
            (targetsVocab && hasVocabErrors) ||
            (targetsListening && hasListeningErrors)) {
            return 1.0; // Perfect match
        }

        return 0.3; // Doesn't target errors
    }

    /**
     * Score variety to prevent boredom
     */
    private scoreVariety(): number {
        // TODO: Track recent quest history (will need quest and context params)
        // For now, slight randomness for variety
        return Math.random() * 0.5 + 0.5;
    }

    /**
     * Get skills targeted by quest
     */
    private getQuestSkills(quest: Quest): string[] {
        const template = quest.template;

        const skillMap: Record<string, string[]> = {
            'RUNE_SCAN': ['comprehension_reading'],
            'ECHO_HUNT': ['comprehension_listening'],
            'SPELL_FORGE': ['language_grammar'],
            'TRADE_PACT': ['production_writing'],
            'GATE_SPEAK': ['production_speaking'],
            'gate_riddle_vocab': ['language_vocab'],
            'ruins_cloze_grammar': ['language_grammar'],
            'market_dialogue_listen': ['comprehension_listening'],
            'library_read_match': ['comprehension_reading'],
        };

        return skillMap[template] || ['language_grammar'];
    }

    /**
     * Estimate quest difficulty for learner
     */
    private estimateDifficulty(quest: Quest, learnerState: LearnerState): number {
        const questSkills = this.getQuestSkills(quest);
        const mastery = learnerState.mastery;

        const skillMasteries = questSkills.map(skill =>
            mastery[skill as keyof typeof mastery] || 0.5
        );
        const avgMastery = skillMasteries.reduce((a, b) => a + b, 0) / skillMasteries.length;

        // Map to difficulty scale (1-10)
        // Lower mastery → higher perceived difficulty
        return Math.round((1.0 - avgMastery) * 10);
    }

    /**
     * Get average mastery across all skills
     */
    private getAverageMastery(learnerState: LearnerState): number {
        const mastery = learnerState.mastery;
        const values = Object.values(mastery);
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     * Explain why this quest was chosen
     */
    private explainBestChoice(quest: Quest, learnerState: LearnerState): string {
        const avgMastery = this.getAverageMastery(learnerState);
        const questSkills = this.getQuestSkills(quest);

        if (avgMastery < 0.3) {
            return `skill_building_${questSkills[0]}`;
        } else if (avgMastery < 0.6) {
            return `balanced_challenge_${questSkills[0]}`;
        } else {
            return `mastery_refinement_${questSkills[0]}`;
        }
    }

    /**
     * Decay epsilon over time (reduce exploration)
     */
    decayEpsilon(streakDays: number): void {
        const decayPer7d = this.brainPack.personalization_policy.quest_selection.exploration.decay_per_7d;
        const epsilonMin = this.brainPack.personalization_policy.quest_selection.exploration.epsilon_min;

        const decayFactor = Math.pow(1 - decayPer7d, Math.floor(streakDays / 7));
        this.epsilon = Math.max(epsilonMin, this.epsilon * decayFactor);
    }
}
