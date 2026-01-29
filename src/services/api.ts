import { getTelegramWebApp } from '@/utils/telegram';

/**
 * Base API Configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * API Error class for better error handling
 */
export class APIError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public response?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get authentication headers from Telegram WebApp
 */
function getAuthHeaders(): HeadersInit {
    const webApp = getTelegramWebApp();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (webApp?.initData) {
        headers['X-Telegram-Init-Data'] = webApp.initData;
    }

    return headers;
}

/**
 * Core fetch wrapper with retry logic and error handling
 */
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retries = MAX_RETRIES
): Promise<Response> {
    try {
        const response = await fetch(url, options);

        // If successful or client error (4xx), return immediately
        if (response.ok || (response.status >= 400 && response.status < 500)) {
            return response;
        }

        // Server error (5xx) - retry
        if (retries > 0 && response.status >= 500) {
            await sleep(RETRY_DELAY_MS);
            return fetchWithRetry(url, options, retries - 1);
        }

        return response;
    } catch (error) {
        // Network error - retry
        if (retries > 0) {
            await sleep(RETRY_DELAY_MS);
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
}

/**
 * Parse response and handle errors
 */
async function parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJSON = contentType?.includes('application/json');

    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorData;

        if (isJSON) {
            try {
                errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
                // Failed to parse error JSON
            }
        }

        throw new APIError(errorMessage, response.status, errorData);
    }

    if (isJSON) {
        return response.json();
    }

    return response.text() as any;
}

/**
 * Centralized API Client
 */
export const apiClient = {
    /**
     * GET request
     */
    async get<T>(endpoint: string): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetchWithRetry(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        return parseResponse<T>(response);
    },

    /**
     * POST request
     */
    async post<T>(endpoint: string, data?: any): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetchWithRetry(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });
        return parseResponse<T>(response);
    },

    /**
     * PUT request
     */
    async put<T>(endpoint: string, data?: any): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetchWithRetry(url, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });
        return parseResponse<T>(response);
    },

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetchWithRetry(url, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        return parseResponse<T>(response);
    },

    /**
     * PATCH request
     */
    async patch<T>(endpoint: string, data?: any): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetchWithRetry(url, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: data ? JSON.stringify(data) : undefined,
        });
        return parseResponse<T>(response);
    },
};

/**
 * Type guard for API responses
 */
export function isSuccessResponse<T>(response: any): response is { success: true; data: T } {
    return response && response.success === true && 'data' in response;
}

export function isErrorResponse(response: any): response is { success: false; error: string } {
    return response && response.success === false && 'error' in response;
}
