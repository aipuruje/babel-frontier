import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Analytics API Routes
 * Handles learning session tracking and insights
 */

// Track learning session
router.post('/session', async (req: Request, res: Response) => {
    try {
        const { userId, moduleId, duration, xpEarned, questionsAnswered, accuracy, startedAt, endedAt } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' });
        }

        await prisma.analyticsSession.create({
            data: {
                userId,
                moduleId,
                duration,
                xpEarned,
                questionsAnswered,
                accuracy,
                startedAt: new Date(startedAt),
                endedAt: new Date(endedAt)
            }
        });

        res.json({
            success: true,
            message: 'Session tracked'
        });
    } catch (error) {
        console.error('Error tracking session:', error);
        res.status(500).json({ success: false, error: 'Failed to track session' });
    }
});

// Send performance metrics
router.post('/performance', async (req: Request, res: Response) => {
    try {
        const { userId, moduleId, metrics } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' });
        }

        // Store as a session with the metrics
        await prisma.analyticsSession.create({
            data: {
                userId,
                moduleId,
                duration: metrics.duration || 0,
                xpEarned: metrics.xpEarned || 0,
                questionsAnswered: metrics.questionsAnswered || 0,
                accuracy: metrics.accuracy || 0,
                startedAt: new Date(metrics.startedAt || Date.now()),
                endedAt: new Date(metrics.endedAt || Date.now())
            }
        });

        res.json({
            success: true,
            message: 'Performance metrics saved'
        });
    } catch (error) {
        console.error('Error saving metrics:', error);
        res.status(500).json({ success: false, error: 'Failed to save metrics' });
    }
});

// Get personalized insights
router.get('/insights/:userId', async (req: Request, res: Response) => {
    try {
        const userId = typeof req.params.userId === 'string' ? req.params.userId : req.params.userId[0];

        const sessions = await prisma.analyticsSession.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 50 // Last 50 sessions
        });

        if (sessions.length < 5) {
            return res.status(404).json({ success: false, error: 'Not enough data for insights' });
        }

        // Calculate insights
        const totalSessions = sessions.length;
        const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
        const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAnswered, 0);
        const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);

        res.json({
            success: true,
            data: {
                totalSessions,
                avgAccuracy,
                totalQuestions,
                totalTime,
                estimatedBand: Math.min(9, Math.max(1, Math.floor(avgAccuracy / 10)))
            }
        });
    } catch (error) {
        console.error('Error fetching insights:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch insights' });
    }
});

// Get weakness report
router.get('/weakness/:userId', async (req: Request, res: Response) => {
    try {
        const userId = typeof req.params.userId === 'string' ? req.params.userId : req.params.userId[0];

        const sessions = await prisma.analyticsSession.findMany({
            where: { userId, moduleId: { not: null } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        // Group by module and calculate average accuracy
        const moduleStats: Record<string, { accuracy: number[], count: number }> = {};
        sessions.forEach(s => {
            if (s.moduleId) {
                if (!moduleStats[s.moduleId]) {
                    moduleStats[s.moduleId] = { accuracy: [], count: 0 };
                }
                moduleStats[s.moduleId].accuracy.push(s.accuracy);
                moduleStats[s.moduleId].count++;
            }
        });

        // Identify weaknesses (modules with below 70% accuracy)
        const weaknesses = Object.entries(moduleStats)
            .map(([moduleId, stats]) => ({
                moduleId,
                avgAccuracy: stats.accuracy.reduce((a, b) => a + b, 0) / stats.count,
                attemptCount: stats.count
            }))
            .filter(w => w.avgAccuracy < 70)
            .sort((a, b) => a.avgAccuracy - b.avgAccuracy);

        res.json({
            success: true,
            data: weaknesses
        });
    } catch (error) {
        console.error('Error generating weakness report:', error);
        res.status(500).json({ success: false, error: 'Failed to generate weakness report' });
    }
});

// Get band prediction
router.get('/prediction/:userId', async (req: Request, res: Response) => {
    try {
        const userId = typeof req.params.userId === 'string' ? req.params.userId : req.params.userId[0];

        const sessions = await prisma.analyticsSession.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20 // Recent sessions for prediction
        });

        if (sessions.length < 10) {
            return res.status(404).json({ success: false, error: 'Not enough data for prediction' });
        }

        const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;
        const predictedBand = Math.min(9, Math.max(1, Math.round(avgAccuracy / 10)));

        res.json({
            success: true,
            data: {
                predictedBand,
                confidence: sessions.length / 20, // Confidence based on data points
                basedOnSessions: sessions.length
            }
        });
    } catch (error) {
        console.error('Error calculating prediction:', error);
        res.status(500).json({ success: false, error: 'Failed to calculate prediction' });
    }
});

export default router;
