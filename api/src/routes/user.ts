import { Router } from 'itty-router';
import { Env } from '../types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getUserFromSession, getSessionId } from '../utils/auth';

export const userRoutes = Router({ base: '/api/user' });

/**
 * GET /api/user/profile
 * Get user profile
 */
userRoutes.get('/profile', async (request, env: Env) => {
    const sessionId = getSessionId(request);
    if (!sessionId) return errorResponse('Unauthorized', 401);

    const user = await getUserFromSession(env.DB, env.SESSIONS, sessionId);
    if (!user) return errorResponse('Invalid session', 401);

    return jsonResponse({ user });
});

/**
 * GET /api/user/stats
 * Get overall user statistics
 */
userRoutes.get('/stats', async (request, env: Env) => {
    const sessionId = getSessionId(request);
    if (!sessionId) return errorResponse('Unauthorized', 401);

    const user = await getUserFromSession(env.DB, env.SESSIONS, sessionId);
    if (!user) return errorResponse('Invalid session', 401);

    try {
        // Get total XP across all modules
        const totalXpResult = await env.DB
            .prepare('SELECT COALESCE(SUM(xp), 0) as total_xp FROM user_progress WHERE user_id = ?')
            .bind(user.id)
            .first<{ total_xp: number }>();

        // Get completed modules count
        const completedModulesResult = await env.DB
            .prepare('SELECT COUNT(*) as completed_count FROM user_progress WHERE user_id = ? AND completed = 1')
            .bind(user.id)
            .first<{ completed_count: number }>();

        // Get total practice attempts
        const totalAttemptsResult = await env.DB
            .prepare('SELECT COUNT(*) as total_attempts FROM practice_attempts WHERE user_id = ?')
            .bind(user.id)
            .first<{ total_attempts: number }>();

        // Get overall accuracy
        const accuracyResult = await env.DB
            .prepare(`
        SELECT 
          COALESCE(SUM(questions_correct), 0) as total_correct,
          COALESCE(SUM(questions_total), 0) as total_questions
        FROM practice_attempts 
        WHERE user_id = ?
      `)
            .bind(user.id)
            .first<{ total_correct: number; total_questions: number }>();

        // Get current streak
        const streakResult = await env.DB
            .prepare('SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = ?')
            .bind(user.id)
            .first<{ current_streak: number; longest_streak: number }>();

        const accuracy = accuracyResult && accuracyResult.total_questions > 0
            ? (accuracyResult.total_correct / accuracyResult.total_questions) * 100
            : 0;

        return jsonResponse({
            total_xp: totalXpResult?.total_xp || 0,
            completed_modules: completedModulesResult?.completed_count || 0,
            total_attempts: totalAttemptsResult?.total_attempts || 0,
            overall_accuracy: Math.round(accuracy * 10) / 10,
            current_streak: streakResult?.current_streak || 0,
            longest_streak: streakResult?.longest_streak || 0,
        });
    } catch (error) {
        console.error('Stats error:', error);
        return errorResponse('Failed to fetch stats', 500);
    }
});

/**
 * GET /api/user/progress
 * Get all module progress for user
 */
userRoutes.get('/progress', async (request, env: Env) => {
    const sessionId = getSessionId(request);
    if (!sessionId) return errorResponse('Unauthorized', 401);

    const user = await getUserFromSession(env.DB, env.SESSIONS, sessionId);
    if (!user) return errorResponse('Invalid session', 401);

    try {
        const { results } = await env.DB
            .prepare('SELECT * FROM user_progress WHERE user_id = ? ORDER BY module_id')
            .bind(user.id)
            .all();

        return jsonResponse({ progress: results || [] });
    } catch (error) {
        console.error('Progress fetch error:', error);
        return errorResponse('Failed to fetch progress', 500);
    }
});
