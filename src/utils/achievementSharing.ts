/**
 * Achievement Sharing - Phase 3 Telegram Growth Hacking
 * Generate shareable achievement cards for viral Telegram sharing
 */

export interface ShareableAchievement {
    type: 'battle_victory' | 'module_complete' | 'level_up' | 'streak' | 'band_milestone';
    title: string;
    description: string;
    icon: string;
    stats?: {
        label: string;
        value: string | number;
    }[];
}

/**
 * Generate Telegram share message for achievements
 */
export function generateAchievementShareMessage(achievement: ShareableAchievement, referralCode: string): string {
    const baseMessages = {
        'battle_victory': `🏆 Just crushed Battle Mode on IELTS Reading Mastery!\n\n${achievement.description}\n\nJoin me and level up your IELTS skills! 🚀`,
        'module_complete': `✅ Module Complete! ${achievement.title}\n\n${achievement.description}\n\nThis app is game-changing for IELTS prep! 📚`,
        'level_up': `⚡ LEVEL UP! ${achievement.title}\n\n${achievement.description}\n\nGrinding towards Band 8+ with IELTS Reading Mastery! 💪`,
        'streak': `🔥 ${achievement.title}\n\n${achievement.description}\n\nConsistency is key! Who's joining the challenge? 🎯`,
        'band_milestone': `🎉 BAND SCORE MILESTONE!\n\n${achievement.title}\n${achievement.description}\n\nCloser to my dream university! 🎓`,
    };

    const message = baseMessages[achievement.type];
    const statsText = achievement.stats
        ? `\n\n📊 Stats:\n${achievement.stats.map(s => `• ${s.label}: ${s.value}`).join('\n')}`
        : '';

    return `${message}${statsText}\n\nUse my code: ${referralCode} for 50 bonus XP!\n👉 https://t.me/ielts_rater_bot?start=${referralCode}`;
}

/**
 * Generate share URL for Telegram
 */
export function generateTelegramShareURL(achievement: ShareableAchievement, referralCode: string): string {
    const message = generateAchievementShareMessage(achievement, referralCode);
    const encodedMessage = encodeURIComponent(message);
    return `https://t.me/share/url?url=https://t.me/ielts_rater_bot?start=${referralCode}&text=${encodedMessage}`;
}

/**
 * Create achievement object from Battle Mode completion
 */
export function createBattleVictoryAchievement(
    score: number,
    totalQuestions: number,
    timeSeconds: number
): ShareableAchievement {
    const accuracy = Math.round((score / totalQuestions) * 100);

    return {
        type: 'battle_victory',
        title: 'Battle Mode Victory!',
        description: `Scored ${score}/${totalQuestions} questions in ${timeSeconds}s!`,
        icon: '🏆',
        stats: [
            { label: 'Accuracy', value: `${accuracy}%` },
            { label: 'Time', value: `${timeSeconds}s` },
            { label: 'XP Earned', value: `+${score * 20}` },
        ],
    };
}

/**
 * Create achievement from module completion
 */
export function createModuleCompleteAchievement(moduleName: string, finalScore: number): ShareableAchievement {
    return {
        type: 'module_complete',
        title: moduleName,
        description: `Mastered with ${finalScore}% completion!`,
        icon: '✅',
        stats: [
            { label: 'Final Score', value: `${finalScore}%` },
            { label: 'Status', value: 'Completed' },
        ],
    };
}

/**
 * Create achievement from level up
 */
export function createLevelUpAchievement(newLevel: number, totalXP: number): ShareableAchievement {
    return {
        type: 'level_up',
        title: `Level ${newLevel} Reached!`,
        description: `Climbed to Level ${newLevel} with ${totalXP.toLocaleString()} total XP!`,
        icon: '⚡',
        stats: [
            { label: 'Current Level', value: newLevel },
            { label: 'Total XP', value: totalXP.toLocaleString() },
        ],
    };
}

/**
 * Create achievement from streak milestone
 */
export function createStreakAchievement(days: number): ShareableAchievement {
    return {
        type: 'streak',
        title: `${days}-Day Streak! 🔥`,
        description: `${days} consecutive days of focused IELTS practice!`,
        icon: '🔥',
        stats: [
            { label: 'Current Streak', value: `${days} days` },
            { label: 'Dedication', value: '100%' },
        ],
    };
}

/**
 * Create achievement from band score milestone
 */
export function createBandMilestoneAchievement(bandScore: number, targetBand: number): ShareableAchievement {
    return {
        type: 'band_milestone',
        title: `Band ${bandScore} Achieved!`,
        description: `Reached Band ${bandScore}! ${bandScore >= targetBand ? 'TARGET ACHIEVED! 🎯' : `${targetBand - bandScore} bands to go!`}`,
        icon: '🎉',
        stats: [
            { label: 'Current Band', value: bandScore },
            { label: 'Target Band', value: targetBand },
        ],
    };
}

/**
 * Telegram community links
 */
export const TELEGRAM_COMMUNITY = {
    channel: 'https://t.me/ielts_reading_mastery',  // Replace with actual channel
    group: 'https://t.me/ielts_reading_community',   // Replace with actual group
    bot: 'https://t.me/ielts_rater_bot',
};
