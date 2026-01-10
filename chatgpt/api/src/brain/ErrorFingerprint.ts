// ErrorFingerprint - Track and manage error patterns
// Implements error tagging with exponential decay

import type { ErrorTag } from "./types";

export interface ErrorFingerprintParams {
    decay_half_life_days: number;  // 14 days
    min_tag_count_to_show: number; // 2 occurrences minimum
    max_tags: number;               // Top 20 tags
}

export class ErrorFingerprintManager {
    private params: ErrorFingerprintParams;

    constructor(params?: Partial<ErrorFingerprintParams>) {
        this.params = {
            decay_half_life_days: 14,
            min_tag_count_to_show: 2,
            max_tags: 20,
            ...params,
        };
    }

    /**
     * Add new error tag(s) from task result
     */
    addErrors(
        currentFingerprint: ErrorTag[],
        newErrorTags: string[]
    ): ErrorTag[] {
        const now = new Date().toISOString();
        const fingerprintMap = new Map<string, ErrorTag>();

        // Load existing tags
        for (const tag of currentFingerprint) {
            fingerprintMap.set(tag.tag, tag);
        }

        // Add/increment new errors
        for (const errorTag of newErrorTags) {
            const existing = fingerprintMap.get(errorTag);

            if (existing) {
                fingerprintMap.set(errorTag, {
                    tag: errorTag,
                    count: existing.count + 1,
                    lastSeenAt: now,
                });
            } else {
                fingerprintMap.set(errorTag, {
                    tag: errorTag,
                    count: 1,
                    lastSeenAt: now,
                });
            }
        }

        // Convert back to array and sort by count
        const updated = Array.from(fingerprintMap.values())
            .sort((a, b) => b.count - a.count);

        // Keep top N
        return updated.slice(0, this.params.max_tags);
    }

    /**
     * Apply exponential decay to error counts
     * Errors become less relevant over time
     */
    applyDecay(fingerprint: ErrorTag[]): ErrorTag[] {
        const now = new Date();
        const decayed: ErrorTag[] = [];

        for (const tag of fingerprint) {
            const lastSeen = new Date(tag.lastSeenAt);
            const daysSince = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);

            // Exponential decay: count * 0.5^(days / half_life)
            const decayFactor = Math.pow(0.5, daysSince / this.params.decay_half_life_days);
            const newCount = tag.count * decayFactor;

            // Keep only if still above threshold
            if (newCount >= this.params.min_tag_count_to_show) {
                decayed.push({
                    ...tag,
                    count: Math.round(newCount * 100) / 100, // Round to 2 decimals
                });
            }
        }

        return decayed.sort((a, b) => b.count - a.count);
    }

    /**
     * Get top N error tags (most frequent)
     */
    getTopErrors(fingerprint: ErrorTag[], n: number = 5): string[] {
        return fingerprint
            .slice(0, n)
            .map(tag => tag.tag);
    }

    /**
     * Check if error tag is repeating (seen 3+ times)
     * Used for forcing review quests
     */
    isRepeatingError(fingerprint: ErrorTag[], errorTag: string): boolean {
        const tag = fingerprint.find(t => t.tag === errorTag);
        return tag ? tag.count >= 3 : false;
    }

    /**
     * Get error tags that need targeted review
     */
    getReviewTargets(fingerprint: ErrorTag[]): string[] {
        return fingerprint
            .filter(tag => tag.count >= 3)
            .map(tag => tag.tag);
    }
}

/**
 * Extract error tags from task result
 * Maps wrong answers to pedagogical error categories
 */
export function extractErrorTags(
    taskType: string,
    expected: Record<string, unknown>,
    userAnswer: unknown,
    isCorrect: boolean
): string[] {
    if (isCorrect) return [];

    const tags: string[] = [];

    // Task-specific error detection
    switch (taskType) {
        case 'MCQ':
        case 'READ_MCQ':
        case 'LISTEN_MCQ':
            tags.push('comprehension_gap');
            break;

        case 'CLOZE':
            // Grammar cloze - try to detect specific grammar errors
            tags.push('grammar_general');
            // TODO: Add more specific detection based on expected answer
            break;

        case 'SHORT_TEXT':
        case 'WRITE_SHORT':
            tags.push('writing_accuracy');
            // TODO: Add NLP-based error detection for writing
            break;

        case 'SPEAK':
        case 'SPEAK_SHORT':
            tags.push('speaking_fluency');
            break;

        case 'READ_MATCH':
            tags.push('vocabulary_gap');
            break;

        default:
            tags.push('general_error');
    }

    return tags;
}

/**
 * Predefined error tag catalog (from Brain Pack)
 */
export const ERROR_TAG_CATALOG = [
    'sva_3rd_person_s',           // Subject-verb agreement
    'articles_a_the_zero',        // Article usage
    'prepositions_in_on_at',      // Preposition choice
    'tense_past_vs_present_perfect', // Tense confusion
    'word_form_noun_verb_adj',    // Word form
    'spelling_common',            // Common spelling errors
    'collocation_make_do',        // Collocation errors
    'pronunciation_th_s_z',       // Pronunciation issues
    'word_order_questions',       // Question word order
    'comprehension_gap',          // Reading/listening comprehension
    'vocabulary_gap',             // Vocabulary knowledge
    'grammar_general',            // General grammar
    'writing_accuracy',           // Writing accuracy
    'speaking_fluency',           // Speaking fluency
    'general_error',              // Catch-all
] as const;

export type ErrorTagType = typeof ERROR_TAG_CATALOG[number];
