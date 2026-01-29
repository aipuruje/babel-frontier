/**
 * Pricing Plans Data - Optimized for "Ambitious Amir" Persona
 * Based on Central Asian market research and IELTS exam economics
 */

export type PricingTier = 'free' | 'premium' | 'lifetime';

export interface PricingPlan {
    id: PricingTier;
    name: string;
    price: number; // Monthly price in USD
    originalPrice?: number; // For showing discounts
    currency: string;
    billingPeriod: 'free' | 'monthly' | 'one-time';
    badge?: string; // "Most Popular", "Best Value"
    features: string[];
    limits: {
        modulesAccess: number | 'all'; // Number of modules or 'all'
        battleModeDailyLimit: number | 'unlimited';
        powerHourAccess: boolean;
        analyticsAccess: 'basic' | 'advanced';
        mockTestsAccess: boolean;
    };
    color: string; // Theme color for UI
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'free',
        name: 'pricing.freeStarter',
        price: 0,
        currency: 'USD',
        billingPeriod: 'free',
        features: [
            'pricing.features.accessModules',
            'pricing.features.battleModeDaily',
            'pricing.features.basicAnalytics',
            'pricing.features.xpSystem',
            'pricing.features.communitySupport',
        ],
        limits: {
            modulesAccess: 3, // Modules 1-3: Skimming, Time Management, TFNG Logic
            battleModeDailyLimit: 3,
            powerHourAccess: false,
            analyticsAccess: 'basic',
            mockTestsAccess: false,
        },
        color: '#9ca3af', // Gray
    },
    {
        id: 'premium',
        name: 'pricing.premiumMonthly',
        price: 9.99,
        currency: 'USD',
        billingPeriod: 'monthly',
        badge: 'pricing.mostPopular',
        features: [
            'pricing.features.allModules',
            'pricing.features.unlimitedBattle',
            'pricing.features.powerHour',
            'pricing.features.advancedAnalytics',
            'pricing.features.mockTests',
            'pricing.features.prioritySupport',
            'pricing.features.cancelAnytime',
        ],
        limits: {
            modulesAccess: 'all',
            battleModeDailyLimit: Infinity,
            powerHourAccess: true,
            analyticsAccess: 'advanced',
            mockTestsAccess: true,
        },
        color: '#667eea', // Purple
    },
    {
        id: 'lifetime',
        name: 'pricing.lifetimeAccess',
        price: 49.99,
        originalPrice: 99.99,
        currency: 'USD',
        billingPeriod: 'one-time',
        badge: 'pricing.bestValue',
        features: [
            'pricing.features.everythingPremium',
            'pricing.features.lifetimeAccess',
            'pricing.features.futureModules',
            'pricing.features.unlimitedMockTests',
            'pricing.features.bandGuarantee',
            'pricing.features.exclusiveMaterials',
            'pricing.features.vipSupport',
        ],
        limits: {
            modulesAccess: 'all',
            battleModeDailyLimit: Infinity,
            powerHourAccess: true,
            analyticsAccess: 'advanced',
            mockTestsAccess: true,
        },
        color: '#f59e0b', // Gold
    },
];

/**
 * Get user's current plan based on profile
 */
export function getUserPlan(isPremium?: boolean, isLifetime?: boolean): PricingTier {
    if (isLifetime) return 'lifetime';
    if (isPremium) return 'premium';
    return 'free';
}

/**
 * Check if user can access a specific module
 */
export function canAccessModule(moduleId: string, userTier: PricingTier): boolean {
    const plan = PRICING_PLANS.find(p => p.id === userTier);
    if (!plan) return false;

    if (plan.limits.modulesAccess === 'all') return true;

    // For free tier: map specific module IDs to access
    // Free tier gets first 3 modules: time-management, tfng-logic, paraphrasing
    if (plan.limits.modulesAccess === 3) {
        const freeModules = ['time-management', 'tfng-logic', 'paraphrasing'];
        return freeModules.includes(moduleId);
    }

    // Fallback for numeric module IDs (if used in future)
    if (typeof plan.limits.modulesAccess === 'number') {
        const moduleNumber = parseInt(moduleId.replace(/\D/g, ''));
        if (!isNaN(moduleNumber)) {
            return moduleNumber <= plan.limits.modulesAccess;
        }
    }

    return false;
}

/**
 * Check if user has Battle Mode attempts left today
 */
export function canPlayBattleMode(
    userTier: PricingTier,
    todayAttempts: number
): { allowed: boolean; remaining: number } {
    const plan = PRICING_PLANS.find(p => p.id === userTier);
    if (!plan) return { allowed: false, remaining: 0 };

    const limit = plan.limits.battleModeDailyLimit;

    // Check if unlimited (Infinity or string)
    if (typeof limit === 'number' && limit === Infinity) {
        return { allowed: true, remaining: Infinity };
    }

    if (limit === 'unlimited') {
        return { allowed: true, remaining: Infinity };
    }

    // Normal number limit
    const remaining = (limit as number) - todayAttempts;
    return {
        allowed: remaining > 0,
        remaining: Math.max(0, remaining),
    };
}

/**
 * Calculate savings for lifetime plan
 */
export function calculateLifetimeSavings(): {
    monthsToBreakEven: number;
    totalSavings: number;
    percentageDiscount: number;
} {
    const lifetimePlan = PRICING_PLANS.find(p => p.id === 'lifetime')!;
    const premiumPlan = PRICING_PLANS.find(p => p.id === 'premium')!;

    const monthsToBreakEven = Math.ceil(lifetimePlan.price / premiumPlan.price);
    const originalPrice = lifetimePlan.originalPrice || lifetimePlan.price * 2;
    const totalSavings = parseFloat((originalPrice - lifetimePlan.price).toFixed(2)); // Fix floating-point precision
    const percentageDiscount = Math.round((totalSavings / originalPrice) * 100);

    return {
        monthsToBreakEven, // 5 months
        totalSavings, // $50.00 (not 49.999999...)
        percentageDiscount, // 50%
    };
}

/**
 * Get upgrade prompt message based on context
 */
export function getUpgradePrompt(context: 'module-locked' | 'battle-limit' | 'mock-test' | 'power-hour'): {
    title: string;
    message: string;
    cta: string;
} {
    const prompts = {
        'module-locked': {
            title: 'upgrade.unlockAdvanced',
            message: 'upgrade.unlockMessage',
            cta: 'upgrade.upgradeToPremium',
        },
        'battle-limit': {
            title: 'upgrade.battleLimitReached',
            message: 'upgrade.battleLimitMessage',
            cta: 'upgrade.getUnlimited',
        },
        'mock-test': {
            title: 'upgrade.fullMockTests',
            message: 'upgrade.mockTestsMessage',
            cta: 'upgrade.tryMockTests',
        },
        'power-hour': {
            title: 'upgrade.powerHourSessions',
            message: 'upgrade.powerHourMessage',
            cta: 'upgrade.unlockPowerHour',
        },
    };

    return prompts[context];
}
