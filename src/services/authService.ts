import { apiClient, isSuccessResponse } from './api';
import type { UserProfile, APIResponse } from '@/types';

/**
 * Authentication Service
 * Handles user registration, login, and profile management
 */

export interface RegisterUserData {
    telegramId: number;
    username?: string;
    firstName: string;
    lastName?: string;
    authMethod: 'phone' | 'email';
    phoneNumber?: string;
    email?: string;
    referredBy?: string; // Referral code of inviter
}

export interface UserResponse {
    id: number;
    telegramId: string;
    username?: string;
    firstName: string;
    lastName?: string;
    authMethod?: 'phone' | 'email';
    phoneNumber?: string;
    email?: string;
    createdAt: string;
    lastActive: string;
}

/**
 * Register a new user or update existing user
 */
export async function register(userData: RegisterUserData): Promise<UserResponse> {
    const response = await apiClient.post<APIResponse<UserResponse>>(
        '/api/auth/register',
        userData
    );

    if (isSuccessResponse(response) && response.data) {
        return response.data;
    }

    throw new Error((response as any).error || 'Registration failed');
}

/**
 * Get user by Telegram ID
 */
export async function getUser(telegramId: number): Promise<UserResponse | null> {
    try {
        const response = await apiClient.get<APIResponse<UserResponse>>(
            `/api/auth/user/${telegramId}`
        );

        if (isSuccessResponse(response) && response.data) {
            return response.data;
        }

        return null;
    } catch (error: any) {
        // If user not found (404), return null instead of throwing
        if (error.statusCode === 404) {
            return null;
        }
        throw error;
    }
}

/**
 * Update user profile
 */
export async function updateProfile(
    telegramId: number,
    updates: Partial<RegisterUserData>
): Promise<UserResponse> {
    const response = await apiClient.patch<APIResponse<UserResponse>>(
        `/api/auth/user/${telegramId}`,
        updates
    );

    if (isSuccessResponse(response) && response.data) {
        return response.data;
    }

    throw new Error((response as any).error || 'Profile update failed');
}

/**
 * Map backend UserResponse to frontend UserProfile
 */
export function mapToUserProfile(backendUser: UserResponse, localProfile?: Partial<UserProfile>): UserProfile {
    return {
        id: backendUser.telegramId,
        telegramId: parseInt(backendUser.telegramId),
        username: backendUser.username || '',
        firstName: backendUser.firstName,
        xp: localProfile?.xp || 0,
        level: localProfile?.level || 1,
        currentBand: localProfile?.currentBand || 0,
        streakDays: localProfile?.streakDays || 0,
        lastActive: backendUser.lastActive,
        createdAt: backendUser.createdAt,
        hasCompletedSignup: true,
        authMethod: backendUser.authMethod,
        phoneNumber: backendUser.phoneNumber,
        email: backendUser.email,
        // Keep local data for fields not synced yet
        targetBand: localProfile?.targetBand,
        examDate: localProfile?.examDate,
        referralCode: localProfile?.referralCode,
        referredBy: localProfile?.referredBy,
        referralCount: localProfile?.referralCount || 0,
        referralXP: localProfile?.referralXP || 0,
        subscriptionTier: localProfile?.subscriptionTier || 'free',
        isPremium: localProfile?.isPremium || false,
        isLifetime: localProfile?.isLifetime || false,
        subscriptionExpiry: localProfile?.subscriptionExpiry,
        battleModeAttemptsToday: localProfile?.battleModeAttemptsToday || 0,
        lastBattleModeReset: localProfile?.lastBattleModeReset,
    };
}
