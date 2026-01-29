import { apiClient, isSuccessResponse } from './api';
import type { APIResponse } from '@/types';

/**
 * Subscription Service
 * Handles premium subscription management and feature access validation
 */

export interface SubscriptionStatus {
    userId: string;
    tier: 'free' | 'premium' | 'lifetime';
    isPremium: boolean;
    isLifetime: boolean;
    expiresAt?: string;
    battleModeCount: number;
    lastBattleReset: string;
}

export interface FeatureAccessCheck {
    feature: 'battle_mode' | 'module_unlock' | 'analytics' | 'leaderboard';
    hasAccess: boolean;
    reason?: string;
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    try {
        const response = await apiClient.get<APIResponse<SubscriptionStatus>>(
            `/api/subscription/${userId}`
        );

        if (isSuccessResponse(response) && response.data) {
            return response.data;
        }

        return null;
    } catch (error: any) {
        if (error.statusCode === 404) {
            // User has no subscription record, return default free tier
            return {
                userId,
                tier: 'free',
                isPremium: false,
                isLifetime: false,
                battleModeCount: 0,
                lastBattleReset: new Date().toISOString(),
            };
        }
        throw error;
    }
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(
    userId: string,
    feature: FeatureAccessCheck['feature']
): Promise<boolean> {
    try {
        const response = await apiClient.post<APIResponse<FeatureAccessCheck>>(
            '/api/subscription/validate',
            { userId, feature }
        );

        if (isSuccessResponse(response) && response.data) {
            return response.data.hasAccess;
        }

        return false;
    } catch (error) {
        console.error('Failed to check feature access:', error);
        return false;
    }
}

/**
 * Track battle mode usage (enforce daily limits)
 */
export async function trackBattleModeUsage(userId: string): Promise<{
    allowed: boolean;
    remaining: number;
    isPremium: boolean;
}> {
    const response = await apiClient.post<APIResponse<{
        allowed: boolean;
        remaining: number;
        isPremium: boolean;
    }>>('/api/subscription/battle-mode', { userId });

    if (isSuccessResponse(response) && response.data) {
        return response.data;
    }

    throw new Error('Failed to track battle mode usage');
}

/**
 * Refresh subscription to check expiry
 */
export async function refreshSubscription(userId: string): Promise<SubscriptionStatus> {
    const status = await getSubscriptionStatus(userId);

    if (!status) {
        throw new Error('Subscription status not found');
    }

    // Check if premium expired
    if (status.isPremium && status.expiresAt) {
        const expiryDate = new Date(status.expiresAt);
        if (expiryDate < new Date()) {
            // Subscription expired, should be updated server-side
            console.warn('Premium subscription expired for user:', userId);
        }
    }

    return status;
}

/**
 * Check if battle mode limit reached for free users
 */
export function isBattleModeLimitReached(
    status: SubscriptionStatus,
    freeUserLimit = 3
): boolean {
    if (status.isPremium || status.isLifetime) {
        return false; // Premium users have unlimited access
    }

    // Check if it's a new day (reset counter)
    const lastReset = new Date(status.lastBattleReset);
    const today = new Date();
    const isSameDay =
        lastReset.getDate() === today.getDate() &&
        lastReset.getMonth() === today.getMonth() &&
        lastReset.getFullYear() === today.getFullYear();

    if (!isSameDay) {
        // New day, counter should be reset server-side
        return false;
    }

    return status.battleModeCount >= freeUserLimit;
}
