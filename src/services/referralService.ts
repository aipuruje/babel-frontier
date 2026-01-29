import { apiClient, isSuccessResponse } from './api';
import type { APIResponse } from '@/types';

/**
 * Referral Service
 * Handles referral tracking and viral growth mechanisms
 */

export interface ReferralStats {
    userId: string;
    referralCode: string;
    referralCount: number;
    referralXP: number;
    totalReferrals: number;
    leaderboardRank?: number;
}

export interface ReferralValidation {
    isValid: boolean;
    referrerUserId?: string;
    message?: string;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    firstName: string;
    referralCount: number;
    referralXP: number;
}

/**
 * Validate a referral code
 */
export async function validateReferralCode(code: string): Promise<ReferralValidation> {
    try {
        const response = await apiClient.post<APIResponse<ReferralValidation>>(
            '/api/referral/validate',
            { code }
        );

        if (isSuccessResponse(response) && response.data) {
            return response.data;
        }

        return { isValid: false, message: 'Invalid referral code' };
    } catch (error) {
        console.error('Failed to validate referral code:', error);
        return { isValid: false, message: 'Validation failed' };
    }
}

/**
 * Track a successful referral
 */
export async function trackReferral(
    referrerCode: string,
    refereeId: string
): Promise<{ success: boolean; xpAwarded: number }> {
    try {
        const response = await apiClient.post<APIResponse<{
            success: boolean;
            xpAwarded: number;
        }>>('/api/referral/track', {
            referrerCode,
            refereeId,
        });

        if (isSuccessResponse(response) && response.data) {
            return response.data;
        }

        return { success: false, xpAwarded: 0 };
    } catch (error) {
        console.error('Failed to track referral:', error);
        return { success: false, xpAwarded: 0 };
    }
}

/**
 * Get referral statistics for a user
 */
export async function getReferralStats(userId: string): Promise<ReferralStats | null> {
    try {
        const response = await apiClient.get<APIResponse<ReferralStats>>(
            `/api/referral/stats/${userId}`
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
 * Get referral leaderboard (top 100)
 */
export async function getReferralLeaderboard(limit = 100): Promise<LeaderboardEntry[]> {
    try {
        const response = await apiClient.get<APIResponse<LeaderboardEntry[]>>(
            `/api/referral/leaderboard?limit=${limit}`
        );

        if (isSuccessResponse(response) && response.data) {
            return response.data;
        }

        return [];
    } catch (error) {
        console.error('Failed to fetch referral leaderboard:', error);
        return [];
    }
}

/**
 * Calculate XP bonus for referral milestones
 */
export function calculateMilestoneBonus(referralCount: number): number {
    const milestones = [
        { count: 5, bonus: 500 },
        { count: 10, bonus: 1000 },
        { count: 25, bonus: 2500 },
        { count: 50, bonus: 5000 },
        { count: 100, bonus: 10000 },
    ];

    let totalBonus = 0;
    for (const milestone of milestones) {
        if (referralCount >= milestone.count) {
            totalBonus += milestone.bonus;
        }
    }

    return totalBonus;
}

/**
 * Generate unique referral code for a user
 */
export function generateReferralCode(firstName: string): string {
    // Format: FIRSTNAME-XXXXX (e.g., "JOHN-A7K9P")
    const namePrefix = firstName.substring(0, 4).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${namePrefix}-${randomSuffix}`;
}
