/**
 * API Client for IELTS Reading Mastery App
 * Handles all backend communication with Cloudflare Workers API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

export class APIError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'APIError';
    }
}

class APIClient {
    private baseURL: string;
    private sessionToken: string | null = null;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
        this.loadSession();
    }

    private loadSession() {
        this.sessionToken = localStorage.getItem('session_token');
    }

    private saveSession(token: string) {
        this.sessionToken = token;
        localStorage.setItem('session_token', token);
    }

    private clearSession() {
        this.sessionToken = null;
        localStorage.removeItem('session_token');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Merge additional headers if provided
        if (options.headers) {
            const additionalHeaders = new Headers(options.headers);
            additionalHeaders.forEach((value, key) => {
                headers[key] = value;
            });
        }

        if (this.sessionToken) {
            headers['Authorization'] = `Bearer ${this.sessionToken}`;
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new APIError(response.status, error.error || response.statusText);
            }

            return await response.json();
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            throw new APIError(0, 'Network error');
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' });
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }

    // ===== Authentication =====

    async login(initData: string) {
        const response = await this.post<{ user: any; session: string }>('/auth/login', { initData });
        this.saveSession(response.session);
        return response.user;
    }

    async getMe() {
        return this.get<{ user: any }>('/auth/me');
    }

    async logout() {
        await this.post('/auth/logout');
        this.clearSession();
    }

    isAuthenticated(): boolean {
        return this.sessionToken !== null;
    }

    // ===== User & Stats =====

    async getUserProfile() {
        return this.get<{ user: any }>('/user/profile');
    }

    async getUserStats() {
        return this.get<{
            total_xp: number;
            completed_modules: number;
            total_attempts: number;
            overall_accuracy: number;
            current_streak: number;
            longest_streak: number;
        }>('/user/stats');
    }

    async getAllProgress() {
        return this.get<{ progress: any[] }>('/user/progress');
    }

    // ===== Module Progress =====

    async getModuleProgress(moduleId: string) {
        return this.get<{ progress: any }>(`/progress/${moduleId}`);
    }

    async startModule(moduleId: string) {
        return this.post<{ progress: any }>(`/progress/${moduleId}/start`);
    }

    async updateModuleProgress(
        moduleId: string,
        data: {
            xp?: number;
            progress?: number;
            masteryLevel?: number;
            completed?: boolean;
        }
    ) {
        return this.put<{ progress: any }>(`/progress/${moduleId}`, data);
    }

    async recordAttempt(data: {
        moduleId: string;
        passageId?: number;
        questionsTotal: number;
        questionsCorrect: number;
        timeSpent: number;
        xpEarned: number;
    }) {
        return this.post('/progress/attempt', data);
    }

    // ===== Analytics =====

    async trackEvent(eventType: string, eventData?: any) {
        return this.post('/analytics/event', { eventType, eventData });
    }

    async getDashboardData() {
        return this.get<{
            moduleProgress: any[];
            recentAttempts: any[];
            timePerModule: any[];
            accuracyTrend: any[];
            streak: { current_streak: number; longest_streak: number };
        }>('/analytics/dashboard');
    }

    async getPerformanceMetrics() {
        return this.get<{
            overall_accuracy: number;
            avg_time_per_question: number;
            performance_by_module: any[];
        }>('/analytics/performance');
    }
}

// Export singleton instance
export const apiClient = new APIClient();
