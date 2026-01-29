// Session time estimates for each module based on educational psychology research
// Teens/young adults: optimal focus sessions of 20-45 minutes

export const MODULE_TIME_ESTIMATES = {
    'time-management': {
        theory: 7,
        practice: 15,
        battle: 5,
        total: 27
    },
    'tfng-logic': {
        theory: 7,
        practice: 15,
        battle: 5,
        total: 27
    },
    'paraphrasing': {
        theory: 8,
        practice: 18,
        battle: 6,
        total: 32
    },
    'heading-matcher': {
        theory: 6,
        practice: 12,
        battle: 5,
        total: 23
    },
    'speed-reading': {
        theory: 5,
        practice: 15,
        battle: 5,
        total: 25
    },
    'cognitive-load': {
        theory: 8,
        practice: 15,
        battle: 5,
        total: 28
    },
    'passage-3': {
        theory: 10,
        practice: 20,
        battle: 7,
        total: 37
    },
    'vocab-expander': {
        theory: 5,
        practice: 25,
        battle: 8,
        total: 38
    },
    'mock-tests': {
        theory: 10,
        practice: 45,
        battle: 15,
        total: 70
    }
} as const;

export type ModuleId = keyof typeof MODULE_TIME_ESTIMATES;

/**
 * Get estimated time for a specific module
 */
export function getModuleEstimate(moduleId: string) {
    return MODULE_TIME_ESTIMATES[moduleId as ModuleId] || {
        theory: 10,
        practice: 20,
        battle: 10,
        total: 40
    };
}

/**
 * Format time estimate for display (e.g., "~25-30 minutes")
 */
export function formatTimeEstimate(minutes: number): string {
    if (minutes < 15) {
        return `~${minutes} min`;
    } else if (minutes < 30) {
        const lower = Math.floor(minutes / 5) * 5;
        const upper = lower + 5;
        return `~${lower}-${upper} min`;
    } else if (minutes < 60) {
        const lower = Math.floor(minutes / 10) * 10;
        const upper = lower + 10;
        return `~${lower}-${upper} min`;
    } else {
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        if (remainingMins === 0) {
            return `~${hours} hr`;
        }
        return `~${hours}h ${remainingMins}m`;
    }
}

/**
 * Get combined estimate for multiple activities
 */
export function getCombinedEstimate(activities: Array<'theory' | 'practice' | 'battle'>, moduleId: string): string {
    const estimates = getModuleEstimate(moduleId);
    const total = activities.reduce((sum, activity) => sum + estimates[activity], 0);
    return formatTimeEstimate(total);
}
