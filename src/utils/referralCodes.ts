/**
 * Referral Code Generation Utility
 * Based on "Ambitious Amir" persona - simple, shareable codes
 */

/**
 * Generate a unique 6-character referral code
 * Format: ABC-XYZ123 (First 3 letters of username + random string)
 * 
 * @param username - User's first name or username
 * @returns Unique referral code (e.g., "AMR-K7X2P9")
 */
export function generateReferralCode(username: string): string {
    const prefix = username
        .replace(/[^a-zA-Z]/g, '') // Remove non-letters
        .slice(0, 3)
        .toUpperCase()
        .padEnd(3, 'X'); // Fallback if username < 3 chars

    const random = Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase();

    return `${prefix}-${random}`;
}

/**
 * Generate Telegram share link with referral code
 * 
 * @param referralCode - User's referral code
 * @param botUsername - Telegram bot username (without @)
 * @returns Deep link URL for Telegram sharing
 */
export function generateTelegramShareLink(
    referralCode: string,
    botUsername: string = 'ielts_rater_bot'
): string {
    return `https://t.me/${botUsername}?start=${referralCode}`;
}

/**
 * Generate share message for Telegram
 * Optimized for "Ambitious Amir" - emphasizes quick results and peer success
 * 
 * @param referralCode - User's referral code
 * @param bandScore - User's current predicted band score
 * @param username - User's name
 * @returns Pre-filled message for Telegram share
 */
export function generateShareMessage(
    t: (key: string, options?: any) => string,
    referralCode: string,
    bandScore?: number
): string {
    const link = generateTelegramShareLink(referralCode);

    if (bandScore && bandScore >= 7.0) {
        return t('share.highScore', { score: bandScore, code: referralCode, link });
    }

    return t('share.standard', { code: referralCode, link });
}

/**
 * Calculate referral rewards based on number of successful referrals
 * 
 * @param referralCount - Number of friends who signed up
 * @returns Total XP earned from referrals
 */
export function calculateReferralRewards(referralCount: number): {
    totalXP: number;
    milestoneRewards: string[];
} {
    const baseXP = 100; // 100 XP per referral
    const totalXP = referralCount * baseXP;

    const milestoneRewards: string[] = [];

    // Milestone bonuses (gamification)
    if (referralCount >= 1) milestoneRewards.push('milestones.first');
    if (referralCount >= 5) milestoneRewards.push('milestones.builder');
    if (referralCount >= 10) milestoneRewards.push('milestones.influencer');
    if (referralCount >= 25) milestoneRewards.push('milestones.ambassador');

    return { totalXP, milestoneRewards };
}

/**
 * Validate referral code format
 * 
 * @param code - Referral code to validate
 * @returns True if code matches expected format
 */
export function isValidReferralCode(code: string): boolean {
    // Format: XXX-YYYYYY (3 letters, dash, 6 alphanumeric)
    const regex = /^[A-Z]{3}-[A-Z0-9]{6}$/;
    return regex.test(code);
}
