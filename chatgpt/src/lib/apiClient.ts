// API Client for Archive of Tongues backend

const API_BASE_URL = 'http://127.0.0.1:8787';

// Storage keys
const TOKEN_KEY = 'archive_session_token';
const USER_ID_KEY = 'archive_user_id';

export interface APIResponse<T = unknown> {
    ok: boolean;
    data?: T;
    error?: string;
    message?: string;
}

class APIClient {
    private baseURL: string;

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
    }

    private getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    private setToken(token: string) {
        localStorage.setItem(TOKEN_KEY, token);
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<APIResponse<T>> {
        const token = this.getToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    ok: false,
                    error: data.error || 'REQUEST_FAILED',
                    message: data.message || 'Request failed',
                };
            }

            return {
                ok: true,
                data,
            };
        } catch (error) {
            console.error('API request failed:', error);
            return {
                ok: false,
                error: 'NETWORK_ERROR',
                message: String(error),
            };
        }
    }

    // Health check
    async health() {
        return this.request<{ service: string; ts: string }>('/health');
    }

    // Authentication (mock for MVP - uses backend /auth/mock)
    async authMock(userId: string = 'demo_player', locale: string = 'uz') {
        const response = await this.request<{
            userId: string;
            locale: string;
            sessionToken: string;
        }>('/auth/mock', {
            method: 'POST',
            body: JSON.stringify({ userId, locale }),
        });

        if (response.ok && response.data) {
            // Store user ID and token
            localStorage.setItem(USER_ID_KEY, response.data.userId);
            this.setToken(response.data.sessionToken);
        }

        return response;
    }

    async getMe() {
        return this.request<{
            player: Record<string, unknown>;
        }>('/me');
    }

    async getNextQuest() {
        return this.request<{
            quest: Record<string, unknown>;
            playerState: Record<string, unknown>;
        }>('/quest/next', {
            method: 'POST',
        });
    }

    async submitQuest(questId: string, answers: Record<string, string>, timeSpentMs: number = 0) {
        return this.request<{
            result: 'VICTORY' | 'DEFEAT';
            xpGained: number;
            shardsGained: number;
            itemsGained: string[];
            playerState: Record<string, unknown>;
        }>('/quest/submit', {
            method: 'POST',
            body: JSON.stringify({
                questId,
                answers,
                timeSpentMs,
            }),
        });
    }

    // Create clan
    async createClan(name: string, region: string = 'UZ') {
        return this.request<{ clanId: string }>('/clan/create', {
            method: 'POST',
            body: JSON.stringify({ name, region }),
        });
    }

    // Join clan
    async joinClan(clanId: string) {
        return this.request<{ ok: boolean }>('/clan/join', {
            method: 'POST',
            body: JSON.stringify({ clanId }),
        });
    }

    async getLeaderboard(type: 'local' | 'global' = 'local') {
        return this.request<{ players: Record<string, unknown>[] }>(`/leaderboard/${type}`);
    }

    // Helper: Check if authenticated
    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    // Helper: Get stored user ID
    getUserId(): string | null {
        return localStorage.getItem(USER_ID_KEY);
    }

    // Logout
    logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_ID_KEY);
    }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export for use in components
export default apiClient;
