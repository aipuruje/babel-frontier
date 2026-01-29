import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { saveBattleScore } from '@/services/progressService';
import { syncQueue } from '@/services/syncQueue';

export interface QuestionSubmission {
    id: string;
    moduleId: string;
    timestamp: string;
    isCorrect: boolean;
    timeSpent?: number; // seconds
}

interface SubmissionStore {
    submissions: QuestionSubmission[];
    addSubmission: (submission: Omit<QuestionSubmission, 'id' | 'timestamp'>) => void;
    getQuestionsToday: () => number;
    getAccuracyToday: () => number;
    getTotalQuestions: () => number;
    getOverallAccuracy: () => number;
    getSubmissionsByModule: (moduleId: string) => QuestionSubmission[];
    getRecentSubmissions: (limit: number) => QuestionSubmission[];
    clearSubmissions: () => void;
    syncBattleScore: (userId: string, moduleId: string, score: number, total: number, timeElapsed: number, xpEarned: number) => Promise<void>;
}

const isToday = (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

export const useSubmissionStore = create<SubmissionStore>()(
    persist(
        (set, get) => ({
            submissions: [],

            addSubmission: (submission) => {
                const newSubmission: QuestionSubmission = {
                    ...submission,
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date().toISOString()
                };

                set((state) => ({
                    submissions: [...state.submissions, newSubmission]
                }));
            },

            getQuestionsToday: () => {
                const { submissions } = get();
                return submissions.filter((s) => isToday(s.timestamp)).length;
            },

            getAccuracyToday: () => {
                const { submissions } = get();
                const todaySubmissions = submissions.filter((s) => isToday(s.timestamp));

                if (todaySubmissions.length === 0) return 0;

                const correct = todaySubmissions.filter((s) => s.isCorrect).length;
                return Math.round((correct / todaySubmissions.length) * 100);
            },

            getTotalQuestions: () => {
                return get().submissions.length;
            },

            getOverallAccuracy: () => {
                const { submissions } = get();

                if (submissions.length === 0) return 0;

                const correct = submissions.filter((s) => s.isCorrect).length;
                return Math.round((correct / submissions.length) * 100);
            },

            getSubmissionsByModule: (moduleId) => {
                const { submissions } = get();
                return submissions.filter((s) => s.moduleId === moduleId);
            },

            getRecentSubmissions: (limit) => {
                const { submissions } = get();
                return [...submissions]
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .slice(0, limit);
            },

            clearSubmissions: () => {
                set({ submissions: [] });
            },

            syncBattleScore: async (userId, moduleId, score, total, timeElapsed, xpEarned) => {
                const accuracy = total > 0 ? (score / total) * 100 : 0;

                try {
                    await saveBattleScore({
                        userId,
                        moduleId,
                        score,
                        timeElapsed,
                        accuracy,
                        xpEarned,
                    });
                } catch (error) {
                    console.error('Failed to sync battle score:', error);
                    // Queue for offline sync
                    syncQueue.enqueue({
                        endpoint: '/api/progress/battle-score',
                        method: 'POST',
                        data: {
                            userId,
                            moduleId,
                            score,
                            timeElapsed,
                            accuracy,
                            xpEarned,
                        },
                    });
                }
            }
        }),
        {
            name: 'ielts-submissions-storage',
            storage: createJSONStorage(() => localStorage)
        }
    )
);
