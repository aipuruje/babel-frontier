import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Referral API Routes
 * Handles viral growth through referral tracking
 */

// Validate referral code
router.post('/validate', async (req: Request, res: Response) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: 'code required' });
        }

        const user = await prisma.user.findUnique({
            where: { referralCode: code }
        });

        if (!user) {
            return res.json({
                success: true,
                data: {
                    isValid: false,
                    message: 'Invalid referral code'
                }
            });
        }

        res.json({
            success: true,
            data: {
                isValid: true,
                referrerUserId: user.telegramId,
                message: 'Referral code is valid'
            }
        });
    } catch (error) {
        console.error('Error validating referral code:', error);
        res.status(500).json({ success: false, error: 'Failed to validate referral code' });
    }
});

// Track referral
router.post('/track', async (req: Request, res: Response) => {
    try {
        const { referrerCode, refereeId } = req.body;

        if (!referrerCode || !refereeId) {
            return res.status(400).json({ success: false, error: 'referrerCode and refereeId required' });
        }

        // Check if referral already exists
        const existingReferral = await prisma.referral.findFirst({
            where: {
                referrerCode,
                refereeId
            }
        });

        if (existingReferral) {
            return res.json({
                success: true,
                data: {
                    success: false,
                    xpAwarded: 0,
                    message: 'Referral already tracked'
                }
            });
        }

        // Create referral
        await prisma.referral.create({
            data: {
                referrerCode,
                refereeId,
                xpAwarded: true
            }
        });

        res.json({
            success: true,
            data: {
                success: true,
                xpAwarded: 100
            }
        });
    } catch (error) {
        console.error('Error tracking referral:', error);
        res.status(500).json({ success: false, error: 'Failed to track referral' });
    }
});

// Get referral stats
router.get('/stats/:userId', async (req: Request, res: Response) => {
    try {
        const userId = typeof req.params.userId === 'string' ? req.params.userId : req.params.userId[0];

        const user = await prisma.user.findUnique({
            where: { telegramId: userId },
            include: {
                referralsMade: true
            }
        });

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const referralCount = user.referralsMade.length;
        const referralXP = referralCount * 100; // 100 XP per referral

        res.json({
            success: true,
            data: {
                userId,
                referralCode: user.referralCode,
                referralCount,
                referralXP,
                totalReferrals: referralCount,
            }
        });
    } catch (error) {
        console.error('Error fetching referral stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch referral stats' });
    }
});

// Get referral leaderboard
router.get('/leaderboard', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;

        // Get all users with their referral counts
        const users = await prisma.user.findMany({
            include: {
                referralsMade: true
            },
            take: limit * 2 // Get more than needed to filter
        });

        // Sort by referral count
        const leaderboard = users
            .map(user => ({
                userId: user.telegramId,
                username: user.username || user.firstName,
                firstName: user.firstName,
                referralCount: user.referralsMade.length,
                referralXP: user.referralsMade.length * 100
            }))
            .filter(entry => entry.referralCount > 0) // Only show users with referrals
            .sort((a, b) => b.referralCount - a.referralCount)
            .slice(0, limit);

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch leaderboard' });
    }
});

export default router;
