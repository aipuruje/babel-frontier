// LocalizationEngine - Smart UZ/RU switching based on Brain Pack rules
// Shows native language explanations when learner struggles

import type { BrainPack, LearnerState, Locale } from "./types";

export interface LocalizationContext {
    learnerState: LearnerState;
    userPreferredLocale: Locale;
    consecutiveFailures: number;
    isMinor: boolean;
    userToggledHelp: boolean;
}

export class LocalizationEngine {
    private brainPack: BrainPack;

    constructor(brainPack: BrainPack) {
        this.brainPack = brainPack;
    }

    /**
     * Determine which locale to show for explanations
     * Brain Pack rules:
     * 1. After 2 consecutive failures on same concept
     * 2. When user toggles 'help me in my language'
     * 3. When minor_safety_mode is on and confusion detected
     */
    shouldShowNativeLanguage(context: LocalizationContext): boolean {
        // Brain Pack rules define when to show UZ/RU (not currently used, logic is inline below)

        // Rule 1: 2+ consecutive failures
        if (context.consecutiveFailures >= 2) {
            return true;
        }

        // Rule 2: User explicitly requested help
        if (context.userToggledHelp) {
            return true;
        }

        // Rule 3: Minor safety mode + confusion
        if (context.isMinor && context.learnerState.fatigue > 0.6) {
            return true; // High fatigue = likely confused
        }

        // Default: English
        return false;
    }

    /**
     * Get appropriate locale for explanation
     */
    getExplanationLocale(context: LocalizationContext): Locale {
        if (this.shouldShowNativeLanguage(context)) {
            // Use user's preferred native language
            return context.userPreferredLocale === 'ru' ? 'ru' : 'uz';
        }

        // Default: simple English
        return 'en';
    }

    /**
     * Format hint message with appropriate locale
     */
    formatHint(
        hintLevel: 1 | 2 | 3,
        hintContentEn: string,
        hintContentUz: string,
        hintContentRu: string,
        context: LocalizationContext
    ): string {
        const locale = this.getExplanationLocale(context);

        switch (locale) {
            case 'uz':
                return hintContentUz;
            case 'ru':
                return hintContentRu;
            default:
                return hintContentEn;
        }
    }

    /**
     * Get story-friendly error message (avoid teacher tone)
     */
    getErrorMessage(
        errorType: string,
        locale: Locale
    ): string {
        const messages: Record<string, Record<Locale, string>> = {
            'grammar_general': {
                en: "The rune's pattern seems off. Let's look at the word order again.",
                uz: "Runening tartibi noto'g'ri ko'rinadi. So'zlar tartibini qayta ko'rib chiqamiz.",
                ru: "Узор руны выглядит не так. Давай ещё раз посмотрим на порядок слов.",
            },
            'vocabulary_gap': {
                en: "This word is new to the Archive. Let me explain...",
                uz: "Bu so'z Arxiv uchun yangi. Tushuntirib beraman...",
                ru: "Это слово новое для Архива. Объясню...",
            },
            'comprehension_gap': {
                en: "The scroll's meaning is tricky here. Read this part again carefully.",
                uz: "Hujjatning mazmuni murakkab. Bu qismni ehtiyotkorlik bilan qayta o'qing.",
                ru: "Смысл свитка тут непростой. Прочитай эту часть ещё раз внимательно.",
            },
        };

        return messages[errorType]?.[locale] || messages['grammar_general'][locale];
    }

    /**
     * Determine if should avoid teacher tone (for teens)
     */
    shouldAvoidTeacherTone(userSegment: string): boolean {
        return userSegment === 'U1_bobur_15' ||
            this.brainPack.personalization_policy.localization_behavior.avoid_teacher_tone_for_teens;
    }
}
