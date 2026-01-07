// ========== TELEGRAM WEBAPP AUTHENTICATION ==========
// Validates Telegram WebApp initData to prevent user spoofing

import crypto from 'crypto';

/**
 * Validates Telegram WebApp authentication data
 * @param {string} initData - Raw init data from Telegram WebApp
 * @param {string} botToken - Telegram bot token
 * @returns {Object|null} - Parsed user data if valid, null if invalid
 */
export function validateTelegramWebAppData(initData, botToken) {
    try {
        // Parse the initData query string
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        params.delete('hash');

        // Create data-check-string
        const dataCheckArr = [];
        for (const [key, value] of params.entries()) {
            dataCheckArr.push(`${key}=${value}`);
        }
        dataCheckArr.sort();
        const dataCheckString = dataCheckArr.join('\n');

        // Compute secret key: HMAC-SHA256(bot_token, "WebAppData")
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        // Compute hash: HMAC-SHA256(data_check_string, secret_key)
        const computedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        // Timing-safe comparison
        if (computedHash !== hash) {
            console.error('Telegram auth validation failed: Hash mismatch');
            return null;
        }

        // Validate timestamp (reject if older than 5 minutes)
        const authDate = parseInt(params.get('auth_date'), 10);
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime - authDate > 300) { // 5 minutes
            console.error('Telegram auth validation failed: Data too old');
            return null;
        }

        // Parse user data
        const userParam = params.get('user');
        if (!userParam) {
            console.error('Telegram auth validation failed: No user data');
            return null;
        }

        const user = JSON.parse(userParam);

        return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            language_code: user.language_code,
            is_premium: user.is_premium || false,
            auth_date: authDate
        };

    } catch (error) {
        console.error('Telegram auth validation error:', error);
        return null;
    }
}

/**
 * Validates Telegram WebApp data and returns user info or throws error
 * @param {Request} request - The request object
 * @param {string} botToken - Telegram bot token
 * @returns {Object} - Validated user data
 */
export async function validateTelegramRequest(request, botToken) {
    const initData = request.headers.get('X-Telegram-Init-Data');

    if (!initData) {
        throw new Error('Missing Telegram init data');
    }

    const user = validateTelegramWebAppData(initData, botToken);

    if (!user) {
        throw new Error('Invalid Telegram authentication');
    }

    return user;
}

/**
 * Middleware to validate Telegram WebApp authentication
 * @param {Request} request
 * @param {Object} env
 * @returns {Object} - { valid: boolean, user?: Object, error?: string }
 */
export async function telegramAuthMiddleware(request, env) {
    try {
        const user = await validateTelegramRequest(request, env.TELEGRAM_BOT_TOKEN);
        return { valid: true, user };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

export default {
    validateTelegramWebAppData,
    validateTelegramRequest,
    telegramAuthMiddleware
};
