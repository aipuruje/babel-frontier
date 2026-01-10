// LearnerState - Manages learner state vector per user
// Implements all Brain Pack learner_model specifications

import type { Env } from "../index";
import type { LearnerState, ErrorTag, DeviceClass, NetworkHint } from "./types";

/**
 * Load learner state from database
 */
export async function getLearnerState(env: Env, userId: string): Promise<LearnerState> {
    const row = await env.DB.prepare(
        `SELECT 
      user_id,
      mastery_json,
      error_fingerprint_json,
      fatigue,
      streak_days,
      device_class,
      network_hint,
      low_power_mode,
      updated_at
    FROM learner_state 
    WHERE user_id = ?1`
    ).bind(userId).first<{
        user_id: string;
        mastery_json: string;
        error_fingerprint_json: string;
        fatigue: number;
        streak_days: number;
        device_class: string;
        network_hint: string;
        low_power_mode: number;
        updated_at: string;
    }>();

    if (!row) {
        // Return default initial state
        return getDefaultLearnerState(userId);
    }

    const mastery = JSON.parse(row.mastery_json);
    const errorFingerprint = JSON.parse(row.error_fingerprint_json) as ErrorTag[];

    return {
        userId: row.user_id,
        mastery: {
            comprehension_reading: mastery.comprehension_reading ?? 0.12,
            comprehension_listening: mastery.comprehension_listening ?? 0.12,
            language_grammar: mastery.language_grammar ?? 0.12,
            language_vocab: mastery.language_vocab ?? 0.12,
            production_writing: mastery.production_writing ?? 0.12,
            production_speaking: mastery.production_speaking ?? 0.12,
        },
        errorFingerprint,
        engagement: {
            streakDays: row.streak_days || 0,
            sessionRegularities: {
                hourHistogram24: new Array(24).fill(0),
                weekdayHistogram7: new Array(7).fill(0),
            },
            frictionSignals: {
                rageQuitCount7d: 0,
                hintDependencyRatio7d: 0.0,
                avgTaskTimeMs7d: 0,
            },
        },
        fatigue: row.fatigue || 0.0,
        attentionDropProbability: calculateAttentionDrop(row.fatigue || 0.0),
        recommendedSessionMinutes: calculateRecommendedSession(row.fatigue || 0.0),
        deviceConstraints: {
            deviceClass: (row.device_class as DeviceClass) || 'android_mid',
            lowPowerMode: Boolean(row.low_power_mode),
            networkHint: (row.network_hint as NetworkHint) || 'wifi',
        },
        updatedAt: row.updated_at,
    };
}

/**
 * Save learner state to database
 */
export async function saveLearnerState(env: Env, state: LearnerState): Promise<void> {
    const masteryJson = JSON.stringify(state.mastery);
    const errorFingerprintJson = JSON.stringify(state.errorFingerprint);
    const now = new Date().toISOString();

    await env.DB.prepare(
        `INSERT INTO learner_state (
      user_id,
      mastery_json,
      error_fingerprint_json,
      fatigue,
      streak_days,
      device_class,
      network_hint,
      low_power_mode,
      updated_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
    ON CONFLICT(user_id) DO UPDATE SET
      mastery_json = excluded.mastery_json,
      error_fingerprint_json = excluded.error_fingerprint_json,
      fatigue = excluded.fatigue,
      streak_days = excluded.streak_days,
      device_class = excluded.device_class,
      network_hint = excluded.network_hint,
      low_power_mode = excluded.low_power_mode,
      updated_at = excluded.updated_at`
    ).bind(
        state.userId,
        masteryJson,
        errorFingerprintJson,
        state.fatigue,
        state.engagement.streakDays,
        state.deviceConstraints.deviceClass,
        state.deviceConstraints.networkHint,
        state.deviceConstraints.lowPowerMode ? 1 : 0,
        now
    ).run();
}

/**
 * Get default initial learner state (Brain Pack specs: init = 0.12 for all skills)
 */
function getDefaultLearnerState(userId: string): LearnerState {
    return {
        userId,
        mastery: {
            comprehension_reading: 0.12,
            comprehension_listening: 0.12,
            language_grammar: 0.12,
            language_vocab: 0.12,
            production_writing: 0.12,
            production_speaking: 0.12,
        },
        errorFingerprint: [],
        engagement: {
            streakDays: 0,
            sessionRegularities: {
                hourHistogram24: new Array(24).fill(0),
                weekdayHistogram7: new Array(7).fill(0),
            },
            frictionSignals: {
                rageQuitCount7d: 0,
                hintDependencyRatio7d: 0.0,
                avgTaskTimeMs7d: 0,
            },
        },
        fatigue: 0.0,
        attentionDropProbability: 0.0,
        recommendedSessionMinutes: 8,
        deviceConstraints: {
            deviceClass: 'android_mid',
            lowPowerMode: false,
            networkHint: 'wifi',
        },
        updatedAt: new Date().toISOString(),
    };
}

/**
 * Calculate attention drop probability from fatigue
 * Higher fatigue = higher probability of mistakes
 */
function calculateAttentionDrop(fatigue: number): number {
    // Sigmoid function: probability increases rapidly above fatigue 0.6
    return 1 / (1 + Math.exp(-10 * (fatigue - 0.6)));
}

/**
 * Calculate recommended session length based on fatigue
 * Lower fatigue = longer recommended sessions
 */
function calculateRecommendedSession(fatigue: number): number {
    const minMinutes = 4;
    const maxMinutes = 15;

    // Linear interpolation: fatigue 0.0 → 15min, fatigue 1.0 → 4min
    return Math.round(maxMinutes - (fatigue * (maxMinutes - minMinutes)));
}

/**
 * Update device constraints from client info
 */
export function updateDeviceConstraints(
    state: LearnerState,
    deviceClass: DeviceClass,
    networkHint: NetworkHint,
    lowPowerMode: boolean
): LearnerState {
    return {
        ...state,
        deviceConstraints: {
            deviceClass,
            networkHint,
            lowPowerMode,
        },
    };
}
