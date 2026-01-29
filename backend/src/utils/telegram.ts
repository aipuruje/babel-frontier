import crypto from 'crypto';

/**
 * Validate Telegram WebApp initData
 * @param initData The initData string from Telegram WebApp
 * @returns true if valid, false otherwise
 */
export function validateTelegramData(initData: string): boolean {
    // eslint-disable-next-line no-undef
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        console.warn('TELEGRAM_BOT_TOKEN not set, skipping validation');
        return true; // Allow in development
    }

    try {
        // Parse the initData

        const params = new URLSearchParams(initData);
        const hash = params.get('hash');

        if (!hash) return false;

        // Remove hash from params
        params.delete('hash');

        // Sort params and create check string
        const checkString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Create secret key
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        // Calculate hash
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(checkString)
            .digest('hex');

        return calculatedHash === hash;
    } catch (error) {
        console.error('Telegram validation error:', error);
        return false;
    }
}
