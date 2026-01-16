import { Router } from 'itty-router';
import { Env, User } from '../types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { validateTelegramData, upsertUser, createSession, getUserFromSession, getSessionId } from '../utils/auth';

export const authRoutes = Router({ base: '/api/auth' });

/**
 * POST /api/auth/login
 * Authenticate user with Telegram initData
 */
authRoutes.post('/login', async (request, env: Env) => {
    try {
        const { initData } = await request.json() as { initData: string };

        if (!initData) {
            return errorResponse('Missing initData', 400);
        }

        // Validate Telegram data
        const telegramData = validateTelegramData(initData, env.TELEGRAM_BOT_TOKEN);

        if (!telegramData) {
            return errorResponse('Invalid Telegram data', 401);
        }

        // Create or update user
        const user = await upsertUser(env.DB, telegramData);

        if (!user) {
            return errorResponse('Failed to create user', 500);
        }

        // Create session
        const sessionId = await createSession(env.SESSIONS, user.id);

        return jsonResponse({
            user,
            session: sessionId,
        });
    } catch (error) {
        console.error('Login error:', error);
        return errorResponse('Login failed', 500);
    }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
authRoutes.get('/me', async (request, env: Env) => {
    const sessionId = getSessionId(request);

    if (!sessionId) {
        return errorResponse('Unauthorized', 401);
    }

    const user = await getUserFromSession(env.DB, env.SESSIONS, sessionId);

    if (!user) {
        return errorResponse('Invalid session', 401);
    }

    return jsonResponse({ user });
});

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
authRoutes.post('/logout', async (request, env: Env) => {
    const sessionId = getSessionId(request);

    if (!sessionId) {
        return jsonResponse({ message: 'Already logged out' });
    }

    // Delete session from KV
    await env.SESSIONS.delete(`session:${sessionId}`);

    return jsonResponse({ message: 'Logged out successfully' });
});
