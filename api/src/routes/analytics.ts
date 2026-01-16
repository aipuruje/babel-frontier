import { Router } from 'itty-router';
import { Env } from '../types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getUserFromSession, getSessionId } from '../utils/auth';

export const analyticsRoutes = Router({ base: '/api/analytics' });

/**
 * POST /api/analytics/event
 * Track an analytics event
 */
analyticsRoutes.post('/event', async (request, env: Env) => {
    const sessionId = getSessionId(request);
    if (!sessionId) return errorResponse('Unauthorized', 401);

    const user = await getUserFromSession(env.DB, env.SESSIONS, sessionId);
    if (!user) return errorResponse('Invalid session', 401);

    const { eventType, eventData } = await request.json() as {
        eventType: string;
        eventData?: any;
    };

    try {
        await env.DB
            .prepare('INSERT INTO analytics_events (user_id, event_type, event_data) VALUES (?, ?, ?)')
            .bind(user.id, eventType, eventData ? JSON.stringify(eventData) : null)
            .run();

        return jsonResponse({ message: 'Event tracked' });
    } catch (error) {
        console.error('Track event error:', error);
        return errorResponse('Failed to track event', 500);
    }
});

/**
 * GET /api/analytics/dashboard
 * Get analytics dashboard data
 */
analyticsRoutes.get('/dashboard', async (request, env: Env) => {
    const sessionId = getSessionId(request);
    if (!sessionId) return errorResponse('Unauthorized', 401);

    const user = await getUserFromSession(env.DB, env.SESSIONS, sessionId);
    if (!user) return errorResponse('Invalid session', 401);

    try {
        // Module progress
        const { results: moduleProgress } = await env.DB
            .prepare('SELECT module_id, xp, progress, mastery_level, completed FROM user_progress WHERE user_id = ?')
            .bind(user.id)
            .all();

        // Recent attempts (last 10)
        const { results: recentAttempts } = await env.DB
            .prepare(`
        SELECT module_id, questions_total, questions_correct, time_spent, completed_at
        FROM practice_attempts 
        WHERE user_id = ? 
        ORDER BY completed_at DESC 
        LIMIT 10
      `)
            .bind(user.id)
            .all();

        // Time spent per module
        const { results: timePerModule } = await env.DB
            .prepare(`
        SELECT module_id, SUM(time_spent) as total_time, COUNT(*) as attempt_count
        FROM practice_attempts 
        WHERE user_id = ? 
        GROUP BY module_id
      `)
            .bind(user.id)
            .all();

        // Accuracy trend (last 7 days)
        const { results: accuracyTrend } = await env.DB
            .prepare(`
        SELECT 
          DATE(completed_at) as date,
          SUM(questions_correct) as correct,
          SUM(questions_total) as total
        FROM practice_attempts 
        WHERE user_id = ? AND completed_at >= datetime('now', '-7 days')
        GROUP BY DATE(completed_at)
        ORDER BY date ASC
      `)
            .bind(user.id)
            .all();

        // Streak info
        const streak = await env.DB
            .prepare('SELECT current_streak, longest_streak FROM user_streaks WHERE user_id = ?')
            .bind(user.id)
            .first();

        return jsonResponse({
            moduleProgress: moduleProgress || [],
            recentAttempts: recentAttempts || [],
            timePerModule: timePerModule || [],
            accuracyTrend: accuracyTrend || [],
            streak: streak || { current_streak: 0, longest_streak: 0 },
        });
    } catch (error) {
        console.error('Dashboard data error:', error);
        return errorResponse('Failed to fetch dashboard data', 500);
    }
});

/**
 * GET /api/analytics/performance
 * Get performance metrics
 */
analyticsRoutes.get('/performance', async (request, env: Env) => {
    const sessionId = getSessionId(request);
    if (!sessionId) return errorResponse('Unauthorized', 401);

    const user = await getUserFromSession(env.DB, env.SESSIONS, sessionId);
    if (!user) return errorResponse('Invalid session', 401);

    try {
        // Overall accuracy
        const accuracy = await env.DB
            .prepare(`
        SELECT 
          SUM(questions_correct) as total_correct,
          SUM(questions_total) as total_questions
        FROM practice_attempts 
        WHERE user_id = ?
      `)
            .bind(user.id)
            .first<{ total_correct: number; total_questions: number }>();

        // Average time per question
        const avgTime = await env.DB
            .prepare(`
        SELECT 
          AVG(CAST(time_spent AS FLOAT) / questions_total) as avg_time_per_question
        FROM practice_attempts 
        WHERE user_id = ? AND questions_total > 0
      `)
            .bind(user.id)
            .first<{ avg_time_per_question: number }>();

        // Performance by module
        const { results: byModule } = await env.DB
            .prepare(`
        SELECT 
          module_id,
          COUNT(*) as attempts,
          SUM(questions_correct) as correct,
          SUM(questions_total) as total,
          AVG(CAST(time_spent AS FLOAT) / questions_total) as avg_time
        FROM practice_attempts 
        WHERE user_id = ?
        GROUP BY module_id
      `)
            .bind(user.id)
            .all();

        const overallAccuracy = accuracy && accuracy.total_questions > 0
            ? (accuracy.total_correct / accuracy.total_questions) * 100
            : 0;

        return jsonResponse({
            overall_accuracy: Math.round(overallAccuracy * 10) / 10,
            avg_time_per_question: Math.round((avgTime?.avg_time_per_question || 0) * 10) / 10,
            performance_by_module: byModule || [],
        });
    } catch (error) {
        console.error('Performance metrics error:', error);
        return errorResponse('Failed to fetch performance metrics', 500);
    }
});
