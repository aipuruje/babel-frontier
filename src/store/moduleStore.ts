import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Module, ModuleProgress, ModuleStore } from '@/types';
import { saveModuleProgress, getAllProgress } from '@/services/progressService';
import { syncQueue } from '@/services/syncQueue';

// Initial 9 modules configuration
const INITIAL_MODULES: Module[] = [
    {
        id: 'time-management',
        name: 'modules.timeManagement.name',
        description: 'modules.timeManagement.description',
        icon: '⏱️',
        painPoint: 'The 60-minute hard stop',
        duration: 20,
        xpReward: 100,
        isLocked: false,
        progress: 0,
        masteryLevel: 0,
        order: 1,
        estimatedTime: {
            theory: 7,
            practice: 15,
            battle: 5,
            total: 27
        }
    },
    {
        id: 'tfng-logic',
        name: 'modules.tfngLogic.name',
        description: 'modules.tfngLogic.description',
        icon: '🎯',
        painPoint: 'True/False/Not Given confusion',
        duration: 25,
        xpReward: 120,
        isLocked: false,
        progress: 0,
        masteryLevel: 0,
        order: 2,
        estimatedTime: {
            theory: 7,
            practice: 15,
            battle: 5,
            total: 27
        }
    },
    {
        id: 'paraphrasing',
        name: 'modules.paraphrasing.name',
        description: 'modules.paraphrasing.description',
        icon: '🔄',
        painPoint: 'Lexical friction & paraphrasing',
        duration: 30,
        xpReward: 150,
        isLocked: false,
        progress: 0,
        masteryLevel: 0,
        order: 3,
        estimatedTime: {
            theory: 8,
            practice: 18,
            battle: 6,
            total: 32
        }
    },
    {
        id: 'heading-matcher',
        name: 'modules.headingMatcher.name',
        description: 'modules.headingMatcher.description',
        icon: '📋',
        painPoint: 'Main idea paradox',
        duration: 25,
        xpReward: 130,
        isLocked: true,
        progress: 0,
        masteryLevel: 0,
        order: 4,
        estimatedTime: {
            theory: 6,
            practice: 12,
            battle: 5,
            total: 23
        }
    },
    {
        id: 'speed-reading',
        name: 'modules.speedReading.name',
        description: 'modules.speedReading.description',
        icon: '⚡',
        painPoint: 'Reading velocity',
        duration: 30,
        xpReward: 140,
        isLocked: true,
        progress: 0,
        masteryLevel: 0,
        order: 5,
        estimatedTime: {
            theory: 5,
            practice: 15,
            battle: 5,
            total: 25
        }
    },
    {
        id: 'cognitive-load',
        name: 'modules.cognitiveLoad.name',
        description: 'modules.cognitiveLoad.description',
        icon: '🧠',
        painPoint: 'Mental exhaustion',
        duration: 20,
        xpReward: 110,
        isLocked: false,
        progress: 0,
        masteryLevel: 0,
        order: 6,
        estimatedTime: {
            theory: 8,
            practice: 15,
            battle: 5,
            total: 28
        }
    },
    {
        id: 'passage-3',
        name: 'modules.passage3.name',
        description: 'modules.passage3.description',
        icon: '🏔️',
        painPoint: 'Progressive difficulty curve',
        duration: 35,
        xpReward: 180,
        isLocked: true,
        progress: 0,
        masteryLevel: 0,
        order: 7,
        estimatedTime: {
            theory: 10,
            practice: 20,
            battle: 7,
            total: 37
        }
    },
    {
        id: 'vocabulary',
        name: 'modules.vocabulary.name',
        description: 'modules.vocabulary.description',
        icon: '📚',
        painPoint: 'Polysemy & lexical gaps',
        duration: 40,
        xpReward: 200,
        isLocked: true,
        progress: 0,
        masteryLevel: 0,
        order: 8,
        estimatedTime: {
            theory: 5,
            practice: 25,
            battle: 8,
            total: 38
        }
    },
    {
        id: 'mock-tests',
        name: 'modules.mockTests.name',
        description: 'modules.mockTests.description',
        icon: '🎓',
        painPoint: 'Real exam conditions',
        duration: 60,
        xpReward: 300,
        isLocked: true,
        progress: 0,
        masteryLevel: 0,
        order: 9,
        estimatedTime: {
            theory: 10,
            practice: 45,
            battle: 15,
            total: 70
        }
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
                    lastAttempt: new Date().toISOString(),
                    version: 0, // Add version tracking
                };

                const newProgress = {
                    ...existingProgress,
                    ...progressUpdate,
                    lastAttempt: new Date().toISOString(),
                    version: (existingProgress.version || 0) + 1, // Increment version
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
            },

            // Backend Sync Methods
            syncProgress: async (moduleId: string, userId: string) => {
                const { progress } = get();
                const moduleProgress = progress[moduleId];

                if (!moduleProgress) {
                    return;
                }

                try {
                    await saveModuleProgress({
                        userId,
                        moduleId,
                        accuracy: moduleProgress.accuracy,
                        timeSpent: moduleProgress.timeSpent,
                        questionsCompleted: moduleProgress.questionsCompleted,
                        masteryLevel: moduleProgress.masteryLevel,
                    });
                } catch (error) {
                    console.error('Failed to sync progress:', error);
                    // Queue for offline sync
                    syncQueue.enqueue({
                        endpoint: '/api/progress',
                        method: 'POST',
                        data: {
                            userId,
                            moduleId,
                            accuracy: moduleProgress.accuracy,
                            timeSpent: moduleProgress.timeSpent,
                            questionsCompleted: moduleProgress.questionsCompleted,
                            masteryLevel: moduleProgress.masteryLevel,
                        },
                    });
                }
            },

            loadProgressFromBackend: async (userId: string) => {
                try {
                    const backendProgress = await getAllProgress(userId);
                    const { progress: localProgress } = get();

                    // Merge backend and local progress with version-based conflict resolution
                    const mergedProgress: Record<string, ModuleProgress> = { ...localProgress };

                    Object.keys(backendProgress).forEach((moduleId) => {
                        const backend = backendProgress[moduleId];
                        const local = localProgress[moduleId];

                        if (!local) {
                            // No local data, use backend
                            mergedProgress[moduleId] = {
                                moduleId: backend.moduleId,
                                accuracy: backend.accuracy,
                                timeSpent: backend.timeSpent,
                                questionsCompleted: backend.questionsCompleted,
                                masteryLevel: backend.masteryLevel,
                                lastAttempt: backend.lastAttempt,
                                version: backend.version || 0,
                            };
                        } else {
                            // Both exist - use version-based conflict resolution
                            const backendVersion = backend.version || 0;
                            const localVersion = local.version || 0;

                            if (backendVersion > localVersion) {
                                // Backend is newer
                                mergedProgress[moduleId] = {
                                    moduleId: backend.moduleId,
                                    accuracy: backend.accuracy,
                                    timeSpent: backend.timeSpent,
                                    questionsCompleted: backend.questionsCompleted,
                                    masteryLevel: backend.masteryLevel,
                                    lastAttempt: backend.lastAttempt,
                                    version: backendVersion,
                                };
                                console.log(`[Sync] Using backend data for ${moduleId} (v${backendVersion} > v${localVersion})`);
                            } else if (localVersion > backendVersion) {
                                // Local is newer - keep local
                                console.log(`[Sync] Keeping local data for ${moduleId} (v${localVersion} > v${backendVersion})`);
                            } else {
                                // Same version - merge non-conflicting fields (take max values)
                                mergedProgress[moduleId] = {
                                    moduleId: backend.moduleId,
                                    accuracy: Math.max(backend.accuracy, local.accuracy),
                                    timeSpent: Math.max(backend.timeSpent, local.timeSpent),
                                    questionsCompleted: Math.max(backend.questionsCompleted, local.questionsCompleted),
                                    masteryLevel: Math.max(backend.masteryLevel, local.masteryLevel),
                                    lastAttempt: new Date(Math.max(
                                        new Date(backend.lastAttempt).getTime(),
                                        new Date(local.lastAttempt).getTime()
                                    )).toISOString(),
                                    version: localVersion,
                                };
                                console.log(`[Sync] Merged data for ${moduleId} (both v${localVersion})`);
                            }
                        }
                    });

                    set({ progress: mergedProgress });
                } catch (error) {
                    console.error('Failed to load progress from backend:', error);
                }
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
