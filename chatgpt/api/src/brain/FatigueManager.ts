// FatigueManager - Real-time fatigue tracking and cooldown management
// Implements Brain Pack fatigue rules

import type { BrainPack } from "./types";

export interface FatigueParams {
    fatigue_gain_per_minute: number;           // +0.02 per minute active
    fatigue_gain_on_wrong: number;             // +0.04 per wrong answer
    fatigue_recovery_per_hour_offline: number; // -0.06 per hour offline
    late_night_hours: number[];                // [23, 0, 1, 2, 3, 4]
    late_night_multiplier: number;             // 1.4x gain during late night
}

export interface FatigueState {
    current: number;                           // 0.0-1.0
    attentionDropProbability: number;          // Derived from fatigue
    recommendedSessionMinutes: number;         // Adaptive session length
    shouldTriggerCooldown: boolean;            // True if fatigue > 0.85
    cooldownMinutes: number;                   // Cooldown duration if triggered
}

export class FatigueManager {
    private params: FatigueParams;

    constructor(brainPack?: BrainPack) {
        // Load params from Brain Pack or use defaults
        this.params = brainPack?.learner_model.update_rules.fatigue_update.params || {
            fatigue_gain_per_minute: 0.02,
            fatigue_gain_on_wrong: 0.04,
            fatigue_recovery_per_hour_offline: 0.06,
            late_night_hours: [23, 0, 1, 2, 3, 4],
            late_night_multiplier: 1.4,
        };
    }

    /**
     * Calculate new fatigue after task session
     */
    calculateAfterTask(
        currentFatigue: number,
        timeSpentMinutes: number,
        errorCount: number,
        totalTasks: number,
        isLateNight: boolean
    ): number {
        let newFatigue = currentFatigue;

        // Time-based fatigue gain
        let timeGain = timeSpentMinutes * this.params.fatigue_gain_per_minute;

        // Late night multiplier (23:00-04:00 Tashkent time)
        if (isLateNight) {
            timeGain *= this.params.late_night_multiplier;
        }

        newFatigue += timeGain;

        // Error-based fatigue gain (frustration)
        const errorRate = totalTasks > 0 ? errorCount / totalTasks : 0;
        newFatigue += errorRate * errorCount * this.params.fatigue_gain_on_wrong;

        // Clamp to [0.0, 1.0]
        return Math.max(0.0, Math.min(1.0, newFatigue));
    }

    /**
     * Calculate fatigue recovery during offline period
     */
    calculateRecovery(currentFatigue: number, hoursOffline: number): number {
        const recovery = hoursOffline * this.params.fatigue_recovery_per_hour_offline;
        return Math.max(0.0, currentFatigue - recovery);
    }

    /**
     * Get full fatigue state with derived metrics
     */
    getState(
        fatigue: number,
        rageQuitCount24h: number = 0
    ): FatigueState {
        return {
            current: fatigue,
            attentionDropProbability: this.calculateAttentionDrop(fatigue),
            recommendedSessionMinutes: this.calculateRecommendedSession(fatigue),
            shouldTriggerCooldown: this.shouldTriggerCooldown(fatigue, rageQuitCount24h),
            cooldownMinutes: this.getCooldownMinutes(fatigue, rageQuitCount24h),
        };
    }

    /**
     * Check if cooldown should trigger
     * Brain Pack rule: fatigue > 0.85 OR rage_quit_count_24h >= 3
     */
    shouldTriggerCooldown(fatigue: number, rageQuitCount24h: number): boolean {
        return fatigue > 0.85 || rageQuitCount24h >= 3;
    }

    /**
     * Calculate cooldown duration (minutes)
     */
    getCooldownMinutes(fatigue: number, rageQuitCount24h: number): number {
        if (!this.shouldTriggerCooldown(fatigue, rageQuitCount24h)) {
            return 0;
        }

        // Base cooldown: 30 minutes
        let cooldown = 30;

        // Escalate if very high fatigue
        if (fatigue > 0.9) {
            cooldown = 60;
        }

        // Escalate if multiple rage quits
        if (rageQuitCount24h >= 5) {
            cooldown = 120;
        }

        return cooldown;
    }

    /**
     * Calculate attention drop probability from fatigue
     * Sigmoid function: probability increases rapidly above fatigue 0.6
     */
    private calculateAttentionDrop(fatigue: number): number {
        return 1 / (1 + Math.exp(-10 * (fatigue - 0.6)));
    }

    /**
     * Calculate recommended session length based on fatigue
     * Lower fatigue = longer recommended sessions
     * Range: 4-15 minutes
     */
    private calculateRecommendedSession(fatigue: number): number {
        const minMinutes = 4;
        const maxMinutes = 15;

        // Linear interpolation: fatigue 0.0 → 15min, fatigue 1.0 → 4min
        return Math.round(maxMinutes - (fatigue * (maxMinutes - minMinutes)));
    }

    /**
     * Check if current hour is late night (Tashkent time: UTC+5)
     */
    isLateNight(timestampIso?: string): boolean {
        const date = timestampIso ? new Date(timestampIso) : new Date();

        // Convert to Tashkent time (UTC+5)
        const tashkentHour = (date.getUTCHours() + 5) % 24;

        return this.params.late_night_hours.includes(tashkentHour);
    }

    /**
     * Get story-friendly cooldown message (Brain Pack requirement)
     */
    getCooldownMessage(locale: 'uz' | 'ru' | 'en' = 'en'): string {
        const messages = {
            en: "The Archive's ancient energies need time to recharge. Rest your mind, traveler, and return when the stars align.",
            uz: "Arxivning qadimiy kuchlari vaqt talab qiladi. Dam oling, sayohatchi, va yulduzlar to'g'ri kelganda qayting.",
            ru: "Древние энергии Архива нуждаются во времени для восстановления. Отдохни, путник, и вернись когда звёзды сойдутся.",
        };

        return messages[locale];
    }
}

/**
 * Track rage quit event
 */
export async function recordRageQuit(
    env: { DB: D1Database },
    userId: string,
    questId: string,
    taskId: string
): Promise<void> {
    await env.DB.prepare(
        `INSERT INTO friction_events (user_id, event_type, quest_id, task_id, ts)
     VALUES (?1, 'rage_quit', ?2, ?3, datetime('now'))`
    ).bind(userId, questId, taskId).run();
}

/**
 * Get rage quit count in last 24 hours
 */
export async function getRageQuitCount24h(
    env: { DB: D1Database },
    userId: string
): Promise<number> {
    const result = await env.DB.prepare(
        `SELECT COUNT(*) as count
     FROM friction_events
     WHERE user_id = ?1
       AND event_type = 'rage_quit'
       AND ts > datetime('now', '-24 hours')`
    ).bind(userId).first<{ count: number }>();

    return result?.count || 0;
}
