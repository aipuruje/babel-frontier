import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile, UserStore } from '@/types';

const LEVEL_XP_CURVE = [
    0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200,
    4000, 5000, 6200, 7600, 9200, 11000, 13000, 15500, 18500, 22000
];

const calculateLevel = (xp: number): number => {
    for (let i = LEVEL_XP_CURVE.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_XP_CURVE[i]) {
            return i + 1;
        }
    }
    return 1;
};

const getXPForNextLevel = (currentLevel: number): number => {
    if (currentLevel >= LEVEL_XP_CURVE.length) {
        return LEVEL_XP_CURVE[LEVEL_XP_CURVE.length - 1] + 25000;
    }
    return LEVEL_XP_CURVE[currentLevel];
};

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            profile: null,
            isAuthenticated: false,
            isLoading: false,

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

            logout: () => {
                set({ profile: null, isAuthenticated: false });
            }
        }),
        {
            name: 'ielts-user-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ profile: state.profile, isAuthenticated: state.isAuthenticated })
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
