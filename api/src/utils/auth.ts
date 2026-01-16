import crypto from 'node:crypto';
import { Env, User } from '../types';

export interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
    is_premium?: boolean;
}

export interface TelegramInitData {
    query_id?: string;
    user?: TelegramUser;
    auth_date: number;
    hash: string;
}

/**
 * Validate Telegram WebApp initData
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramData(initData: string, botToken: string): TelegramInitData | null {
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');

        if (!hash) {
            return null;
        }

        // Remove hash from params
        urlParams.delete('hash');

        // Sort params alphabetically and create data-check-string
        const dataCheckString = Array.from(urlParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Create HMAC-SHA256 hash
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        // Verify hash matches
        if (calculatedHash !== hash) {
            console.error('Hash validation failed');
            return null;
        }

        // Check auth_date is not too old (within 1 hour)
        const authDate = parseInt(urlParams.get('auth_date') || '0');
        const currentTime = Math.floor(Date.now() / 1000);

        if (currentTime - authDate > 3600) {
            console.error('Auth data too old');
            return null;
        }

        // Parse user data
        const userStr = urlParams.get('user');
        if (!userStr) {
            return null;
        }

        const user: TelegramUser = JSON.parse(userStr);

        return {
            query_id: urlParams.get('query_id') || undefined,
            user,
            auth_date: authDate,
            hash,
        };
    } catch (error) {
        console.error('Telegram data validation error:', error);
        return null;
    }
}

/**
 * Create or update user in database
 */
export async function upsertUser(db: D1Database, telegramData: TelegramInitData): Promise<User | null> {
    if (!telegramData.user) {
        return null;
    }

    const { user } = telegramData;

    try {
        // Check if user exists
        const existing = await db
            .prepare('SELECT * FROM users WHERE telegram_id = ?')
            .bind(user.id.toString())
            .first<User>();

        if (existing) {
            // Update existing user
            await db
                .prepare(`
          UPDATE users 
          SET username = ?, first_name = ?, last_name = ?, 
              photo_url = ?, language_code = ?, is_premium = ?,
              last_active = CURRENT_TIMESTAMP
          WHERE telegram_id = ?
        `)
                .bind(
                    user.username || null,
                    user.first_name,
                    user.last_name || null,
                    user.photo_url || null,
                    user.language_code || 'en',
                    user.is_premium || false,
                    user.id.toString()
                )
                .run();

            // Fetch updated user
            return await db
                .prepare('SELECT * FROM users WHERE telegram_id = ?')
                .bind(user.id.toString())
                .first<User>();
        } else {
            // Insert new user
            await db
                .prepare(`
          INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, language_code, is_premium)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
                .bind(
                    user.id.toString(),
                    user.username || null,
                    user.first_name,
                    user.last_name || null,
                    user.photo_url || null,
                    user.language_code || 'en',
                    user.is_premium || false
                )
                .run();

            // Fetch new user
            return await db
                .prepare('SELECT * FROM users WHERE telegram_id = ?')
                .bind(user.id.toString())
                .first<User>();
        }
    } catch (error) {
        console.error('User upsert error:', error);
        return null;
    }
}

/**
 * Create session token
 */
export async function createSession(kv: KVNamespace, userId: number): Promise<string> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionData = {
        userId,
        createdAt: Date.now(),
    };

    // Store in KV with 7 day TTL
    await kv.put(`session:${sessionId}`, JSON.stringify(sessionData), {
        expirationTtl: 7 * 24 * 60 * 60, // 7 days
    });

    return sessionId;
}

/**
 * Get user from session
 */
export async function getUserFromSession(
    db: D1Database,
    kv: KVNamespace,
    sessionId: string
): Promise<User | null> {
    try {
        const sessionData = await kv.get(`session:${sessionId}`, 'json') as { userId: number } | null;

        if (!sessionData) {
            return null;
        }

        const user = await db
            .prepare('SELECT * FROM users WHERE id = ?')
            .bind(sessionData.userId)
            .first<User>();

        return user;
    } catch (error) {
        console.error('Session retrieval error:', error);
        return null;
    }
}

/**
 * Extract session ID from Authorization header
 */
export function getSessionId(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
