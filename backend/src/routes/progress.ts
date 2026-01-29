import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Progress API Routes
 * Handles module progress and battle mode scores
 */

// Save module progress
router.post('/', async (req: Request, res: Response) => {
    try {
        const { userId, moduleId, accuracy, timeSpent, questionsCompleted, masteryLevel } = req.body;

        if (!userId || !moduleId) {
            return res.status(400).json({ success: false, error: 'userId and moduleId required' });
        }

        // Check if progress already exists
        const existingProgress = await prisma.moduleProgress.findUnique({
            where: { userId_moduleId: { userId, moduleId } }
        });

        let progress;
        if (existingProgress) {
            // Update existing progress
            progress = await prisma.moduleProgress.update({
                where: { id: existingProgress.id },
                data: {
                    accuracy: accuracy !== undefined ? accuracy : existingProgress.accuracy,
                    timeSpent: timeSpent !== undefined ? existingProgress.timeSpent + timeSpent : existingProgress.timeSpent,
                    questionsCompleted: questionsCompleted !== undefined ? existingProgress.questionsCompleted + questionsCompleted : existingProgress.questionsCompleted,
                    masteryLevel: masteryLevel !== undefined ? masteryLevel : existingProgress.masteryLevel,
                    lastAttempt: new Date(),
                }
            });
        } else {
            // Create new progress
            progress = await prisma.moduleProgress.create({
                data: {
                    userId,
                    moduleId,
                    accuracy: accuracy || 0,
                    timeSpent: timeSpent || 0,
                    questionsCompleted: questionsCompleted || 0,
                    masteryLevel: masteryLevel || 0,
                }
            });
        }

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Error saving progress:', error);
        res.status(500).json({ success: false, error: 'Failed to save progress' });
    }
});

// Get all progress for a user
router.get('/:userId', async (req: Request, res: Response) => {
    try {
        const userId = typeof req.params.userId === 'string' ? req.params.userId : req.params.userId[0];

        const progressList = await prisma.moduleProgress.findMany({
            where: { userId },
            orderBy: { lastAttempt: 'desc' }
        });

        // Convert to dictionary format expected by frontend
        const progressDict: Record<string, any> = {};
        progressList.forEach(p => {
            progressDict[p.moduleId] = p;
        });

        res.json({
            success: true,
            data: progressDict
        });
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch progress' });
    }
});

// Get module-specific progress
router.get('/:userId/:moduleId', async (req: Request, res: Response) => {
    try {
        const userId = typeof req.params.userId === 'string' ? req.params.userId : req.params.userId[0];
        const moduleId = typeof req.params.moduleId === 'string' ? req.params.moduleId : req.params.moduleId[0];

        const progress = await prisma.moduleProgress.findUnique({
            where: { userId_moduleId: { userId, moduleId } }
        });

        if (!progress) {
            return res.status(404).json({ success: false, error: 'Progress not found' });
        }

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Error fetching module progress:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch module progress' });
    }
});

// Save battle mode score
router.post('/battle-score', async (req: Request, res: Response) => {
    try {
        const { userId, moduleId, score, timeElapsed, accuracy, xpEarned } = req.body;

        if (!userId || !moduleId) {
            return res.status(400).json({ success: false, error: 'userId and moduleId required' });
        }

        // Save as an analytics session (battle mode is a special session type)
        await prisma.analyticsSession.create({
            data: {
                userId,
                moduleId,
                duration: Math.floor(timeElapsed / 60), // Convert seconds to minutes
                xpEarned: xpEarned || 0,
                questionsAnswered: score || 0,
                accuracy: accuracy || 0,
                startedAt: new Date(Date.now() - timeElapsed * 1000),
                endedAt: new Date(),
            }
        });

        res.json({
            success: true,
            message: 'Battle score saved'
        });
    } catch (error) {
        console.error('Error saving battle score:', error);
        res.status(500).json({ success: false, error: 'Failed to save battle score' });
    }
});

// Award XP
router.post('/award-xp', async (req: Request, res: Response) => {
    try {
        const { userId, amount, source } = req.body;

        if (!userId || !amount) {
            return res.status(400).json({ success: false, error: 'userId and amount required' });
        }

        // For now, just acknowledge the XP award
        // In a full implementation, you'd update a user XP field
        // Since we don't have that in the schema yet, we just track it in analytics

        res.json({
            success: true,
            message: `Awarded ${amount} XP for ${source}`
        });
    } catch (error) {
        console.error('Error awarding XP:', error);
        res.status(500).json({ success: false, error: 'Failed to award XP' });
    }
});

export default router;
