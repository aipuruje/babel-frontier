import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile, UserStore } from '@/types';
import { register, getUser, mapToUserProfile } from '@/services/authService';
import { generateReferralCode } from '@/services/referralService';
import { getSubscriptionStatus } from '@/services/subscriptionService';
import { getTelegramWebApp } from '@/utils/telegram';

// XP curve for first 20 levels (for backward compatibility)
const LEVEL_XP_CURVE = [
    0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
    4000, 5000, 6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000
];

/**
 * Calculate XP required for a given level
 * Uses exponential formula for levels beyond 20
 * Formula: XP = floor(100 * 1.5^(level - 1))
 */
const getXPForLevel = (level: number): number => {
    if (level <= 0) return 0;
    if (level <= LEVEL_XP_CURVE.length) {
        return LEVEL_XP_CURVE[level - 1];
    }
    // Exponential formula for infinite levels
    return Math.floor(100 * Math.pow(1.5, level - 1));
};

const calculateLevel = (xp: number): number => {
    // Check hardcoded curve first (levels 1-20)
    for (let i = LEVEL_XP_CURVE.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_XP_CURVE[i]) {
            return i + 1;
        }
    }

    // For levels beyond 20, use formula
    let level = 20;
    while (getXPForLevel(level + 1) <= xp) {
        level++;
        // Safety check to prevent infinite loop
        if (level > 1000) break;
    }

    return level;
};

const getXPForNextLevel = (currentLevel: number): number => {
    return getXPForLevel(currentLevel + 1);
};

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            focusStats: {
                totalFocusTime: 0,
                weeklyFocusTime: [0, 0, 0, 0, 0, 0, 0],
                longestStreak: 0,
                currentStreak: 0,
                sessionsCompleted: 0,
                powerHoursCompleted: 0,
            },
            preferences: {
                breakRemindersEnabled: true,
                breakReminderInterval: 20,
                focusModeEnabled: false,
                soundEffectsEnabled: true,
            },
            currentSession: null,

            setProfile: (profile: UserProfile) => {
                set({ profile, isAuthenticated: true, isLoading: false });
            },

            updateXP: (xpGain: number) => {
                const { profile } = get();
                if (!profile) return;

                const newXP = profile.xp + xpGain;
                const newLevel = calculateLevel(newXP);
                const leveledUp = newLevel > profile.level;

                set({
                    profile: {
                        ...profile,
                        xp: newXP,
                        level: newLevel
                    }
                });

                // Return level up status for UI feedback
                return {
                    leveledUp,
                    newLevel,
                    xpGained: xpGain
                };
            },

            incrementStreak: () => {
                const { profile } = get();
                if (!profile) return;

                const lastActive = new Date(profile.lastActive);
                const today = new Date();
                const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

                let newStreak = profile.streakDays;

                if (daysDiff === 1) {
                    // Consecutive day - increment streak
                    newStreak += 1;
                } else if (daysDiff > 1) {
                    // Missed a day - reset streak
                    newStreak = 1;
                }
                // daysDiff === 0 means same day, keep streak as is

                set({
                    profile: {
                        ...profile,
                        streakDays: newStreak,
                        lastActive: today.toISOString()
                    }
                });
            },

            completeSignup: (method: 'phone' | 'email', value: string) => {
                const { profile } = get();
                if (!profile) return;

                set({
                    profile: {
                        ...profile,
                        hasCompletedSignup: true,
                        authMethod: method,
                        ...(method === 'phone' ? { phoneNumber: value } : { email: value })
                    }
                });
            },

            logout: () => {
                set({ profile: null, isAuthenticated: false });
            },

            // Backend Sync Methods
            registerUser: async (authMethod: 'phone' | 'email', value: string, referredBy?: string) => {
                const webApp = getTelegramWebApp();
                if (!webApp?.initDataUnsafe?.user) {
                    throw new Error('Telegram user data not available');
                }

                set({ isLoading: true });

                try {
                    const telegramUser = webApp.initDataUnsafe.user;

                    // Generate referral code
                    const referralCode = generateReferralCode(telegramUser.first_name);

                    // Register with backend
                    const backendUser = await register({
                        telegramId: telegramUser.id,
                        username: telegramUser.username,
                        firstName: telegramUser.first_name,
                        lastName: telegramUser.last_name,
                        authMethod,
                        phoneNumber: authMethod === 'phone' ? value : undefined,
                        email: authMethod === 'email' ? value : undefined,
                        referredBy,
                    });

                    // Create full user profile
                    const profile: UserProfile = mapToUserProfile(backendUser, {
                        xp: 0,
                        level: 1,
                        currentBand: 0,
                        streakDays: 0,
                        referralCode,
                        referredBy,
                        hasCompletedSignup: true,
                    });

                    set({ profile, isAuthenticated: true, isLoading: false });
                    return profile;
                } catch (error) {
                    console.error('Failed to register user:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            restoreSession: async () => {
                const webApp = getTelegramWebApp();
                if (!webApp?.initDataUnsafe?.user) {
                    return null;
                }

                set({ isLoading: true });

                try {
                    const telegramUser = webApp.initDataUnsafe.user;
                    const backendUser = await getUser(telegramUser.id);

                    if (!backendUser) {
                        set({ isLoading: false });
                        return null;
                    }

                    // Merge with local profile if exists
                    const { profile: localProfile } = get();
                    const profile = mapToUserProfile(backendUser, localProfile || undefined);

                    // Fetch subscription status
                    try {
                        const subscriptionStatus = await getSubscriptionStatus(backendUser.telegramId);
                        if (subscriptionStatus) {
                            profile.subscriptionTier = subscriptionStatus.tier;
                            profile.isPremium = subscriptionStatus.isPremium;
                            profile.isLifetime = subscriptionStatus.isLifetime;
                            profile.subscriptionExpiry = subscriptionStatus.expiresAt;
                            profile.battleModeAttemptsToday = subscriptionStatus.battleModeCount;
                            profile.lastBattleModeReset = subscriptionStatus.lastBattleReset;
                        }
                    } catch (error) {
                        console.error('Failed to fetch subscription status:', error);
                    }

                    set({ profile, isAuthenticated: true, isLoading: false });
                    return profile;
                } catch (error) {
                    console.error('Failed to restore session:', error);
                    set({ isLoading: false });
                    return null;
                }
            },

            syncProfile: async () => {
                const { profile } = get();
                if (!profile || !profile.telegramId) {
                    return;
                }

                try {
                    // This will be expanded in Phase 4.3 to sync all progress
                    // For now, just verify the backend connection works
                    await getUser(profile.telegramId);
                } catch (error) {
                    console.error('Failed to sync profile:', error);
                    // Don't throw - sync failures shouldn't block user actions
                }
            },

            // Viral Referral System Methods
            addReferral: () => {
                const { profile, updateXP } = get();
                if (!profile) return;

                const referralXPBonus = 100; // 100 XP per successful referral
                const newReferralCount = (profile.referralCount || 0) + 1;
                const newReferralXP = (profile.referralXP || 0) + referralXPBonus;

                // Update profile
                set({
                    profile: {
                        ...profile,
                        referralCount: newReferralCount,
                        referralXP: newReferralXP,
                    }
                });

                // Award XP bonus
                updateXP(referralXPBonus);

                return {
                    newCount: newReferralCount,
                    xpEarned: referralXPBonus,
                };
            },

            startFocusSession: (moduleId) => {
                const session = {
                    id: Date.now().toString(),
                    startTime: new Date().toISOString(),
                    duration: 0,
                    moduleId,
                    breaksTaken: 0,
                    completed: false,
                };
                set({ currentSession: session });
                localStorage.setItem('currentFocusSession', JSON.stringify(session));
            },

            endFocusSession: () => {
                const { currentSession, focusStats } = get();
                if (!currentSession) return;

                const endTime = new Date();
                const duration = Math.floor(
                    (endTime.getTime() - new Date(currentSession.startTime).getTime()) / 60000
                );

                const completedSession = {
                    ...currentSession,
                    endTime: endTime.toISOString(),
                    duration,
                    completed: true,
                };

                // Update stats
                const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
                const newWeekly = [...focusStats.weeklyFocusTime];
                newWeekly[today] += duration;

                // Check for streaks
                const lastSession = focusStats.lastSessionDate
                    ? new Date(focusStats.lastSessionDate)
                    : null;
                const daysDiff = lastSession
                    ? Math.floor((endTime.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;

                let newCurrentStreak = focusStats.currentStreak;
                if (!lastSession || daysDiff === 0) {
                    // Same day or first session
                    newCurrentStreak = 1;
                } else if (daysDiff === 1) {
                    // Consecutive day
                    newCurrentStreak += 1;
                } else {
                    // Missed days - reset
                    newCurrentStreak = 1;
                }

                const newLongestStreak = Math.max(focusStats.longestStreak, newCurrentStreak);

                set({
                    currentSession: null,
                    focusStats: {
                        ...focusStats,
                        totalFocusTime: focusStats.totalFocusTime + duration,
                        weeklyFocusTime: newWeekly,
                        sessionsCompleted: focusStats.sessionsCompleted + 1,
                        currentStreak: newCurrentStreak,
                        longestStreak: newLongestStreak,
                        lastSessionDate: endTime.toISOString(),
                    },
                });

                localStorage.removeItem('currentFocusSession');
                // Store completed session in history
                const history = JSON.parse(localStorage.getItem('focusHistory') || '[]');
                history.push(completedSession);
                localStorage.setItem('focusHistory', JSON.stringify(history.slice(-30))); // Keep last 30
            },

            addBreakToSession: () => {
                const { currentSession } = get();
                if (!currentSession) return;

                set({
                    currentSession: {
                        ...currentSession,
                        breaksTaken: currentSession.breaksTaken + 1,
                    },
                });
            },

            updatePreferences: (prefs) => {
                set((state) => ({
                    preferences: { ...state.preferences, ...prefs },
                }));
            },
        }),
        {
            name: 'ielts-user-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                profile: state.profile,
                isAuthenticated: state.isAuthenticated,
                focusStats: state.focusStats,
                preferences: state.preferences,
            }),
        }
    )
);

// Selectors for computed values
export const useCurrentLevel = () => useUserStore((state) => state.profile?.level || 1);
export const useCurrentXP = () => useUserStore((state) => state.profile?.xp || 0);
export const useXPProgress = () => {
    const profile = useUserStore((state) => state.profile);
    if (!profile) return { current: 0, required: 100, percentage: 0 };

    const currentLevelXP = LEVEL_XP_CURVE[profile.level - 1] || 0;
    const nextLevelXP = getXPForNextLevel(profile.level);
    const xpInCurrentLevel = profile.xp - currentLevelXP;
    const xpRequiredForLevel = nextLevelXP - currentLevelXP;
    const percentage = Math.floor((xpInCurrentLevel / xpRequiredForLevel) * 100);

    return {
        current: xpInCurrentLevel,
        required: xpRequiredForLevel,
        percentage: Math.min(percentage, 100)
    };
};

export const useStreakDays = () => useUserStore((state) => state.profile?.streakDays || 0);
export const useCurrentBand = () => useUserStore((state) => state.profile?.currentBand || 0);
