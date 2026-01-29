import { apiClient, isSuccessResponse } from './api';
import type { APIResponse, PerformanceMetrics, WeaknessReport } from '@/types';

/**
 * Analytics Service
 * Tracks learning sessions and provides personalized insights
 */

export interface LearningSession {
    userId: string;
    moduleId?: string;
    duration: number; // minutes
    xpEarned: number;
    questionsAnswered: number;
    accuracy: number;
    startedAt: string;
    endedAt: string;
}

export interface PerformanceData {
    userId: string;
    moduleId?: string;
    metrics: {
        accuracy: number;
        speed: number; // words per minute
        completionRate: number;
        masteryLevel: number;
    };
    weaknesses: string[];
    strengths: string[];
}

export interface BandPrediction {
    predictedBand: number; // 0-9 with decimals
    confidence: number; // 0-100
    breakdown: {
        accuracy: number;
        speed: number;
        consistency: number;
        vocabulary: number;
    };
    nextSteps: string[];
}

/**
 * Track a learning session
 */
export async function trackSession(sessionData: LearningSession): Promise<void> {
    try {
        await apiClient.post('/api/analytics/session', sessionData);
    } catch (error) {
        console.error('Failed to track session:', error);
        // Don't throw - analytics failure shouldn't block user actions
    }
}

/**
 * Send performance metrics
 */
export async function sendPerformanceMetrics(data: PerformanceData): Promise<void> {
    try {
        await apiClient.post('/api/analytics/performance', data);
    } catch (error) {
        console.error('Failed to send performance metrics:', error);
    }
}

/**
 * Get personalized insights for a user
 */
export async function getInsights(userId: string): Promise<PerformanceMetrics | null> {
    try {
        const response = await apiClient.get<APIResponse<PerformanceMetrics>>(
            `/api/analytics/insights/${userId}`
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
 * Get AI-driven weakness report
 */
export async function getWeaknessReport(userId: string): Promise<WeaknessReport[]> {
    try {
        const response = await apiClient.get<APIResponse<WeaknessReport[]>>(
            `/api/analytics/weakness/${userId}`
        );

        if (isSuccessResponse(response) && response.data) {
            return response.data;
        }

        return [];
    } catch (error) {
        console.error('Failed to fetch weakness report:', error);
        return [];
    }
}

/**
 * Get band score prediction
 */
export async function getBandPrediction(userId: string): Promise<BandPrediction | null> {
    try {
        const response = await apiClient.get<APIResponse<BandPrediction>>(
            `/api/analytics/prediction/${userId}`
        );

        if (isSuccessResponse(response) && response.data) {
            return response.data;
        }

        return null;
    } catch (error: any) {
        if (error.statusCode === 404) {
            // Not enough data for prediction yet
            return null;
        }
        console.error('Failed to fetch band prediction:', error);
        return null;
    }
}

/**
 * Helper: Calculate session duration
 */
export function calculateSessionDuration(startTime: Date, endTime: Date): number {
    return Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60); // minutes
}

/**
 * Helper: Track session start (returns session ID)
 */
export function startSessionTracking(moduleId?: string): {
    sessionId: string;
    startTime: Date;
    moduleId?: string;
} {
    return {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        startTime: new Date(),
        moduleId,
    };
}

/**
 * Helper: Complete session tracking
 */
export async function completeSessionTracking(
    sessionStart: ReturnType<typeof startSessionTracking>,
    userId: string,
    questionsAnswered: number,
    correctAnswers: number,
    xpEarned: number
): Promise<void> {
    const endTime = new Date();
    const duration = calculateSessionDuration(sessionStart.startTime, endTime);
    const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;

    const sessionData: LearningSession = {
        userId,
        moduleId: sessionStart.moduleId,
        duration,
        xpEarned,
        questionsAnswered,
        accuracy,
        startedAt: sessionStart.startTime.toISOString(),
        endedAt: endTime.toISOString(),
    };

    await trackSession(sessionData);
}
