import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Module, ModuleProgress, ModuleStore } from '@/types';

// Initial 9 modules configuration
const INITIAL_MODULES: Module[] = [
    {
        id: 'time-management',
        name: 'Time Management Simulator',
        description: 'Master the 60-minute challenge with strategic pacing',
        icon: '⏱️',
        painPoint: 'The 60-minute hard stop',
        duration: 20,
        xpReward: 100,
        isLocked: false,
        progress: 0,
        masteryLevel: 0,
        order: 1
    },
    {
        id: 'tfng-logic',
        name: 'TFNG Logic Trainer',
        description: 'Conquer ternary logic and inference traps',
        icon: '🎯',
        painPoint: 'True/False/Not Given confusion',
        duration: 25,
        xpReward: 120,
        isLocked: false,
        progress: 0,
        masteryLevel: 0,
        order: 2
    },
    {
        id: 'paraphrasing',
        name: 'Paraphrasing Master',
        description: 'Defeat keyword spotting with synonym mastery',
        icon: '🔄',
        painPoint: 'Lexical friction & paraphrasing',
        duration: 30,
        xpReward: 150,
        isLocked: false,
        progress: 0,
        masteryLevel: 0,
        order: 3
    },
    {
        id: 'heading-matcher',
        name: 'Heading Matcher Pro',
        description: 'Identify main ideas and avoid distractors',
        icon: '📋',
        painPoint: 'Main idea paradox',
        duration: 25,
        xpReward: 130,
        isLocked: true,
        progress: 0,
        masteryLevel: 0,
        order: 4
    },
    {
        id: 'speed-reading',
        name: 'Speed Reading Boot Camp',
        description: 'Boost your WPM from 200 to 300+',
        icon: '⚡',
        painPoint: 'Reading velocity',
        duration: 30,
        xpReward: 140,
        isLocked: true,
        progress: 0,
        masteryLevel: 0,
        order: 5
    },
    {
        id: 'cognitive-load',
        name: 'Cognitive Load Manager',
        description: 'Combat decision fatigue and maintain focus',
        icon: '🧠',
        painPoint: 'Mental exhaustion',
        duration: 20,
        xpReward: 110,
        isLocked: false,
        progress: 0,
        masteryLevel: 0,
        order: 6
    },
    {
        id: 'passage-3',
        name: 'Passage 3 Survival Kit',
        description: 'Conquer the hardest passage with energy management',
        icon: '🏔️',
        painPoint: 'Progressive difficulty curve',
        duration: 35,
        xpReward: 180,
        isLocked: true,
        progress: 0,
        masteryLevel: 0,
        order: 7
    },
    {
        id: 'vocabulary',
        name: 'Vocabulary Expander',
        description: 'Master 500 academic words with context',
        icon: '📚',
        painPoint: 'Polysemy & lexical gaps',
        duration: 40,
        xpReward: 200,
        isLocked: true,
        progress: 0,
        masteryLevel: 0,
        order: 8
    },
    {
        id: 'mock-tests',
        name: 'Full Mock Tests',
        description: '10 complete IELTS Reading simulations',
        icon: '🎓',
        painPoint: 'Real exam conditions',
        duration: 60,
        xpReward: 300,
        isLocked: true,
        progress: 0,
        masteryLevel: 0,
        order: 9
    }
];

export const useModuleStore = create<ModuleStore>()(
    persist(
        (set, get) => ({
            modules: INITIAL_MODULES,
            currentModule: null,
            progress: {},

            setModules: (modules: Module[]) => {
                set({ modules });
            },

            selectModule: (moduleId: string) => {
                const { modules } = get();
                const module = modules.find((m) => m.id === moduleId);
                if (module && !module.isLocked) {
                    set({ currentModule: module });
                }
            },

            updateProgress: (moduleId: string, progressUpdate: Partial<ModuleProgress>) => {
                const { progress, modules } = get();

                const existingProgress = progress[moduleId] || {
                    moduleId,
                    accuracy: 0,
                    timeSpent: 0,
                    questionsCompleted: 0,
                    masteryLevel: 0,
                    lastAttempt: new Date().toISOString()
                };

                const newProgress = {
                    ...existingProgress,
                    ...progressUpdate,
                    lastAttempt: new Date().toISOString()
                };

                // Update module completion percentage
                const updatedModules = modules.map((m) => {
                    if (m.id === moduleId) {
                        return {
                            ...m,
                            progress: Math.floor(newProgress.masteryLevel),
                            masteryLevel: newProgress.masteryLevel
                        };
                    }
                    return m;
                });

                set({
                    progress: {
                        ...progress,
                        [moduleId]: newProgress
                    },
                    modules: updatedModules
                });
            },

            unlockNextModule: () => {
                const { modules } = get();

                // Find the first locked module
                const firstLockedIndex = modules.findIndex((m) => m.isLocked);

                if (firstLockedIndex === -1) return; // All unlocked

                const updatedModules = modules.map((m, index) => {
                    if (index === firstLockedIndex) {
                        return { ...m, isLocked: false };
                    }
                    return m;
                });

                set({ modules: updatedModules });
            }
        }),
        {
            name: 'ielts-module-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ modules: state.modules, progress: state.progress })
        }
    )
);

// Selectors
export const useAvailableModules = () =>
    useModuleStore((state) => state.modules.filter((m) => !m.isLocked));

export const useModuleById = (moduleId: string) =>
    useModuleStore((state) => state.modules.find((m) => m.id === moduleId));

export const useModuleProgress = (moduleId: string) =>
    useModuleStore((state) => state.progress[moduleId]);

export const useCompletedModulesCount = () =>
    useModuleStore((state) => state.modules.filter((m) => m.progress >= 100).length);

export const useTotalModules = () =>
    useModuleStore((state) => state.modules.length);
