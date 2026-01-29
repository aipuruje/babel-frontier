import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { validatePhone, validateEmail } from '../utils/validators';
import { ValidationError, ConflictError } from '../middleware/errorHandler';

const router = Router();

interface RegisterRequest {
    telegramId: number;
    username?: string;
    firstName: string;
    authMethod: 'phone' | 'email';
    phoneNumber?: string;
    email?: string;
    initData?: string;
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next) => {
    try {
        const {
            telegramId,
            username,
            firstName,
            authMethod,
            phoneNumber,
            email
        }: RegisterRequest = req.body;

        // Validate required fields
        if (!telegramId || !firstName || !authMethod) {
            throw new ValidationError('Missing required fields: telegramId, firstName, authMethod');
        }

        // Validate auth method
        if (authMethod !== 'phone' && authMethod !== 'email') {
            throw new ValidationError('Auth method must be either "phone" or "email"');
        }

        // Validate contact information
        if (authMethod === 'phone') {
            if (!phoneNumber) {
                throw new ValidationError('Phone number is required');
            }
            if (!validatePhone(phoneNumber)) {
                throw new ValidationError('Invalid phone number format');
            }
        } else {
            if (!email) {
                throw new ValidationError('Email is required');
            }
            if (!validateEmail(email)) {
                throw new ValidationError('Invalid email format');
            }
        }

        // Optional: Validate Telegram initData
        // Uncomment when you have a bot token
        // if (initData && !validateTelegramData(initData)) {
        //   throw new AuthenticationError('Invalid Telegram authentication data');
        // }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) }
        });

        if (existingUser) {
            // Update existing user
            const updatedUser = await prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: {
                    username,
                    firstName,
                    authMethod,
                    phoneNumber: authMethod === 'phone' ? phoneNumber : undefined,
                    email: authMethod === 'email' ? email : undefined,
                    lastActive: new Date()
                }
            });

            return res.json({
                success: true,
                message: 'User profile updated',
                user: {
                    id: updatedUser.id,
                    telegramId: updatedUser.telegramId.toString(),
                    username: updatedUser.username,
                    firstName: updatedUser.firstName,
                    authMethod: updatedUser.authMethod,
                    phoneNumber: updatedUser.phoneNumber,
                    email: updatedUser.email,
                    createdAt: updatedUser.createdAt,
                    lastActive: updatedUser.lastActive
                }
            });
        }

        // Check for duplicate phone/email
        if (authMethod === 'phone' && phoneNumber) {
            const duplicatePhone = await prisma.user.findUnique({
                where: { phoneNumber }
            });
            if (duplicatePhone) {
                throw new ConflictError('This phone number is already registered');
            }
        }

        if (authMethod === 'email' && email) {
            const duplicateEmail = await prisma.user.findUnique({
                where: { email }
            });
            if (duplicateEmail) {
                throw new ConflictError('This email is already registered');
            }
        }

        // Create new user
        const newUser = await prisma.user.create({
            data: {
                telegramId: BigInt(telegramId),
                username,
                firstName,
                authMethod,
                phoneNumber: authMethod === 'phone' ? phoneNumber : null,
                email: authMethod === 'email' ? email : null,
                lastActive: new Date()
            }
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                telegramId: newUser.telegramId.toString(),
                username: newUser.username,
                firstName: newUser.firstName,
                authMethod: newUser.authMethod,
                phoneNumber: newUser.phoneNumber,
                email: newUser.email,
                createdAt: newUser.createdAt,
                lastActive: newUser.lastActive
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/user/:telegramId
router.get('/user/:telegramId', async (req: Request, res: Response, next) => {
    try {
        const { telegramId } = req.params;
        const telegramIdNum = parseInt(telegramId as string, 10);

        if (isNaN(telegramIdNum)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid Telegram ID'
            });
        }

        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramIdNum) }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                telegramId: user.telegramId.toString(),
                username: user.username,
                firstName: user.firstName,
                authMethod: user.authMethod,
                phoneNumber: user.phoneNumber,
                email: user.email,
                createdAt: user.createdAt,
                lastActive: user.lastActive
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
