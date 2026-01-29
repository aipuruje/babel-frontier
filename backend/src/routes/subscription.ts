import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * Subscription API Routes
 * Handles premium subscriptions and feature access control
 */

// Get subscription status
router.get('/:userId', async (req: Request, res: Response) => {
    try {
        const userId = typeof req.params.userId === 'string' ? req.params.userId : req.params.userId[0];

        let subscription = await prisma.subscription.findUnique({
            where: { userId }
        });

        if (!subscription) {
            // Create default free tier subscription
            subscription = await prisma.subscription.create({
                data: {
                    userId,
                    tier: 'free',
                    isPremium: false,
                    isLifetime: false,
                }
            });
        }

        // Check if premium expired
        if (subscription.isPremium && subscription.expiresAt) {
            if (new Date(subscription.expiresAt) < new Date()) {
                subscription = await prisma.subscription.update({
                    where: { userId },
                    data: { isPremium: false }
                });
            }
        }

        // Check if battle mode should reset (daily)
        const lastReset = new Date(subscription.lastBattleReset);
        const today = new Date();
        if (lastReset.getDate() !== today.getDate() ||
            lastReset.getMonth() !== today.getMonth() ||
            lastReset.getFullYear() !== today.getFullYear()) {
            // Reset battle mode count
            subscription = await prisma.subscription.update({
                where: { userId },
                data: {
                    battleModeCount: 0,
                    lastBattleReset: today
                }
            });
        }

        res.json({
            success: true,
            data: subscription
        });
    } catch (error) {
        console.error('Error fetching subscription:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch subscription' });
    }
});

// Validate feature access
router.post('/validate', async (req: Request, res: Response) => {
    try {
        const { userId, feature } = req.body;

        if (!userId || !feature) {
            return res.status(400).json({ success: false, error: 'userId and feature required' });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId }
        });

        const isPremium = subscription?.isPremium || false;

        // Define which features require premium
        const premiumFeatures = ['advanced-analytics', 'unlimited-battles', 'custom-modules'];
        const requiresPremium = premiumFeatures.includes(feature);

        res.json({
            success: true,
            data: {
                feature,
                hasAccess: !requiresPremium || isPremium,
                reason: requiresPremium && !isPremium ? 'Premium subscription required' : 'Access granted'
            }
        });
    } catch (error) {
        console.error('Error validating feature access:', error);
        res.status(500).json({ success: false, error: 'Failed to validate feature access' });
    }
});

// Track battle mode usage
router.post('/battle-mode', async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId required' });
        }

        const subscription = await prisma.subscription.findUnique({
            where: { userId }
        });

        if (!subscription) {
            return res.status(404).json({ success: false, error: 'Subscription not found' });
        }

        const FREE_DAILY_LIMIT = 3;
        const isPremium = subscription.isPremium || subscription.isLifetime;
        const limitReached = !isPremium && subscription.battleModeCount >= FREE_DAILY_LIMIT;

        if (!limitReached) {
            // Increment battle mode count
            await prisma.subscription.update({
                where: { userId },
                data: {
                    battleModeCount: subscription.battleModeCount + 1
                }
            });
        }

        res.json({
            success: true,
            data: {
                allowed: !limitReached,
                remaining: isPremium ? 999 : Math.max(0, FREE_DAILY_LIMIT - subscription.battleModeCount - 1),
                isPremium
            }
        });
    } catch (error) {
        console.error('Error tracking battle mode usage:', error);
        res.status(500).json({ success: false, error: 'Failed to track battle mode usage' });
    }
});

export default router;
