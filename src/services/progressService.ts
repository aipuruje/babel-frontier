import { apiClient, isSuccessResponse } from './api';
import type { ModuleProgress, APIResponse } from '@/types';

/**
 * Progress Service
 * Handles module progress synchronization with backend
 */

export interface ProgressData {
    userId: string;
    moduleId: string;
    accuracy: number;
    timeSpent: number;
    questionsCompleted: number;
    masteryLevel: number;
}

export interface BackendProgress {
    id: number;
    userId: string;
    moduleId: string;
    accuracy: number;
    timeSpent: number;
    questionsCompleted: number;
    masteryLevel: number;
    lastAttempt: string;
    createdAt: string;
    updatedAt: string;
    version?: number; // For conflict resolution
}

export interface BattleScore {
    userId: string;
    moduleId: string;
    score: number;
    timeElapsed: number;
    accuracy: number;
    xpEarned: number;
}

export interface XPAward {
    userId: string;
    amount: number;
    source: string; // e.g., "module_complete", "battle_mode", "daily_streak"
    metadata?: any;
}

/**
 * Save module progress to backend
 */
export async function saveModuleProgress(progressData: ProgressData): Promise<BackendProgress> {
    const response = await apiClient.post<APIResponse<BackendProgress>>(
        '/api/progress',
        progressData
    );

    if (isSuccessResponse(response) && response.data) {
        return response.data;
    }

    throw new Error((response as any).error || 'Failed to save progress');
}

/**
 * Get all module progress for a user
 */
export async function getAllProgress(userId: string): Promise<Record<string, BackendProgress>> {
    try {
        const response = await apiClient.get<APIResponse<BackendProgress[]>>(
            `/api/progress/${userId}`
        );

        if (isSuccessResponse(response) && response.data) {
            // Convert array to keyed object by moduleId
            const progressMap: Record<string, BackendProgress> = {};
            response.data.forEach(progress => {
                progressMap[progress.moduleId] = progress;
            });
            return progressMap;
        }

        return {};
    } catch (error: any) {
        if (error.statusCode === 404) {
            return {};
        }
        throw error;
    }
}

/**
 * Get progress for a specific module
 */
export async function getModuleProgress(
    userId: string,
    moduleId: string
): Promise<BackendProgress | null> {
    try {
        const response = await apiClient.get<APIResponse<BackendProgress>>(
            `/api/progress/${userId}/${moduleId}`
        );

        if (isSuccessResponse(response) && response.data) {
            return response.data;
        }

        return null;
    } catch (error: any) {
        if (error.statusCode === 404) {
            return null;
        }
        throw error;
    }
}

/**
 * Save battle mode score
 */
export async function saveBattleScore(scoreData: BattleScore): Promise<void> {
    await apiClient.post('/api/progress/battle-score', scoreData);
}

/**
 * Award XP (server-side validation)
 */
export async function awardXP(xpData: XPAward): Promise<void> {
    await apiClient.post('/api/progress/award-xp', xpData);
}

/**
 * Map backend progress to frontend ModuleProgress
 */
export function mapToModuleProgress(backendProgress: BackendProgress): ModuleProgress {
    return {
        moduleId: backendProgress.moduleId,
        accuracy: backendProgress.accuracy,
        timeSpent: backendProgress.timeSpent,
        questionsCompleted: backendProgress.questionsCompleted,
        masteryLevel: backendProgress.masteryLevel,
        lastAttempt: backendProgress.lastAttempt,
    };
}

/**
 * Merge local and remote progress (newer wins)
 */
export function mergeProgress(
    local: ModuleProgress | undefined,
    remote: BackendProgress | null
): ModuleProgress {
    if (!local && !remote) {
        throw new Error('Both local and remote progress are missing');
    }

    if (!remote) {
        return local!;
    }

    if (!local) {
        return mapToModuleProgress(remote);
    }

    // Compare timestamps - use newer data
    const localTimestamp = new Date(local.lastAttempt).getTime();
    const remoteTimestamp = new Date(remote.lastAttempt).getTime();

    if (remoteTimestamp > localTimestamp) {
        return mapToModuleProgress(remote);
    }

    return local;
}
