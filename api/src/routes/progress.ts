import { Router } from 'itty-router';
import { Env } from '../types';
import { jsonResponse, errorResponse } from '../utils/cors';
import { getUserFromSession, getSessionId } from '../utils/auth';

export const progressRoutes = Router({ base: '/api/progress' });

/**
 * GET /api/progress/:moduleId
 * Get progress for a specific module
 */
progressRoutes.get('/:moduleId', async (request, env: Env) => {
    const sessionId = getSessionId(request);
    if (!sessionId) return errorResponse('Unauthorized', 401);

    const user = await getUserFromSession(env.DB, env.SESSIONS, sessionId);
    if (!user) return errorResponse('Invalid session', 401);

    const { moduleId } = request.params as { moduleId: string };

    try {
        const progress = await env.DB
            .prepare('SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?')
            .bind(user.id, moduleId)
            .first();

        return jsonResponse({ progress: progress || null });
    } catch (error) {
        console.error('Progress fetch error:', error);
        return errorResponse('Failed to fetch progress', 500);
    }
});

/**
 * POST /api/progress/:moduleId/start
 * Start a module
 */
progressRoutes.post('/:moduleId/start', async (request, env: Env) => {
    const sessionId = getSessionId(request);
    if (!sessionId) return errorResponse('Unauthorized', 401);

    const user = await getUserFromSession(env.DB, env.SESSIONS, sessionId);
    if (!user) return errorResponse('Invalid session', 401);

    const { moduleId } = request.params as { moduleId: string };

    try {
        // Check if already exists
        const existing = await env.DB
            .prepare('SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?')
            .bind(user.id, moduleId)
            .first();

        if (!existing) {
            // Create new progress entry
            await env.DB
                .prepare(`
          INSERT INTO user_progress (user_id, module_id, xp, progress, mastery_level, completed)
          VALUES (?, ?, 0, 0, 0, 0)
        `)
                .bind(user.id, moduleId)
                .run();
        }

        const progress = await env.DB
            .prepare('SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?')
            .bind(user.id, moduleId)
            .first();

        return jsonResponse({ progress });
    } catch (error) {
        console.error('Start module error:', error);
        return errorResponse('Failed to start module', 500);
    }
});

/**
 * PUT /api/progress/:moduleId
 * Update module progress
 */
progressRoutes.put('/:moduleId', async (request, env: Env) => {
    const sessionId = getSessionId(request);
    if (!sessionId) return errorResponse('Unauthorized', 401);

    const user = await getUserFromSession(env.DB, env.SESSIONS, sessionId);
    if (!user) return errorResponse('Invalid session', 401);

    const { moduleId } = request.params as { moduleId: string };
    const { xp, progress, masteryLevel, completed } = await request.json() as {
        xp?: number;
        progress?: number;
        masteryLevel?: number;
        completed?: boolean;
    };

    try {
        // Build update query dynamically based on provided fields
        const updates: string[] = [];
        const values: any[] = [];

        if (xp !== undefined) {
            updates.push('xp = xp + ?');
            values.push(xp);
        }
        if (progress !== undefined) {
            updates.push('progress = ?');
            values.push(progress);
        }
        if (masteryLevel !== undefined) {
            updates.push('mastery_level = ?');
            values.push(masteryLevel);
        }
        if (completed !== undefined) {
            updates.push('completed = ?');
            values.push(completed ? 1 : 0);
        }

        updates.push('last_practiced = CURRENT_TIMESTAMP');

        if (updates.length === 1) {
            // Only timestamp update
            return errorResponse('No fields to update', 400);
        }

        values.push(user.id, moduleId);

        await env.DB
            .prepare(`
        UPDATE user_progress 
        SET ${updates.join(', ')}
        WHERE user_id = ? AND module_id = ?
      `)
            .bind(...values)
            .run();

        const updated = await env.DB
            .prepare('SELECT * FROM user_progress WHERE user_id = ? AND module_id = ?')
            .bind(user.id, moduleId)
            .first();

        return jsonResponse({ progress: updated });
    } catch (error) {
        console.error('Update progress error:', error);
        return errorResponse('Failed to update progress', 500);
    }
});

/**
 * POST /api/progress/attempt
 * Record a practice attempt
 */
progressRoutes.post('/attempt', async (request, env: Env) => {
    const sessionId = getSessionId(request);
    if (!sessionId) return errorResponse('Unauthorized', 401);

    const user = await getUserFromSession(env.DB, env.SESSIONS, sessionId);
    if (!user) return errorResponse('Invalid session', 401);

    const {
        moduleId,
        passageId,
        questionsTotal,
        questionsCorrect,
        timeSpent,
        xpEarned
    } = await request.json() as {
        moduleId: string;
        passageId?: number;
        questionsTotal: number;
        questionsCorrect: number;
        timeSpent: number;
        xpEarned: number;
    };

    try {
        // Insert practice attempt
        await env.DB
            .prepare(`
        INSERT INTO practice_attempts 
        (user_id, module_id, passage_id, questions_total, questions_correct, time_spent, xp_earned)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
            .bind(user.id, moduleId, passageId || null, questionsTotal, questionsCorrect, timeSpent, xpEarned)
            .run();

        // Update streak
        await updateStreak(env.DB, user.id);

        return jsonResponse({ message: 'Attempt recorded successfully' });
    } catch (error) {
        console.error('Record attempt error:', error);
        return errorResponse('Failed to record attempt', 500);
    }
});

/**
 * Helper function to update user streak
 */
async function updateStreak(db: D1Database, userId: number) {
    const today = new Date().toISOString().split('T')[0];

    const streak = await db
        .prepare('SELECT * FROM user_streaks WHERE user_id = ?')
        .bind(userId)
        .first<{ current_streak: number; longest_streak: number; last_activity_date: string }>();

    if (!streak) {
        // Create initial streak
        await db
            .prepare('INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date) VALUES (?, 1, 1, ?)')
            .bind(userId, today)
            .run();
    } else {
        const lastDate = new Date(streak.last_activity_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        let newStreak = streak.current_streak;

        if (diffDays === 0) {
            // Same day, no change
            return;
        } else if (diffDays === 1) {
            // Consecutive day, increment
            newStreak = streak.current_streak + 1;
        } else {
            // Streak broken, reset
            newStreak = 1;
        }

        const newLongest = Math.max(newStreak, streak.longest_streak);

        await db
            .prepare('UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_activity_date = ? WHERE user_id = ?')
            .bind(newStreak, newLongest, today, userId)
            .run();
    }
}
