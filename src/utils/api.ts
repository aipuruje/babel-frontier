// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

interface RegisterUserData {
    telegramId: number;
    username?: string;
    firstName: string;
    authMethod: 'phone' | 'email';
    phoneNumber?: string;
    email?: string;
}

interface UserProfile {
    id: number;
    telegramId: string;
    username?: string;
    firstName: string;
    authMethod: string;
    phoneNumber?: string;
    email?: string;
    createdAt: string;
    lastActive?: string;
}

/**
 * Register a new user or update existing user
 */
export async function registerUser(data: RegisterUserData): Promise<ApiResponse<UserProfile>> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.error || 'Registration failed',
            };
        }

        return {
            success: true,
            data: result.user,
        };
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Get user by Telegram ID
 */
export async function getUserByTelegramId(telegramId: number): Promise<ApiResponse<UserProfile>> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/user/${telegramId}`);
        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: result.error || 'Failed to fetch user',
            };
        }

        return {
            success: true,
            data: result.user,
        };
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error',
        };
    }
}

/**
 * Check API health
 */
export async function checkApiHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch {
        return false;
    }
}
