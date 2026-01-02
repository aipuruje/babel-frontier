import WebApp from '@twa-dev/sdk';

// Notification manager for Telegram Mini App
class NotificationManager {
    constructor() {
        this.enabled = true;
        this.lastNotification = {};
    }

    // Show Telegram notification
    showNotification(title, message, type = 'info') {
        if (!this.enabled) return;

        // Prevent spam
        const key = `${title}-${message}`;
        const now = Date.now();
        if (this.lastNotification[key] && now - this.lastNotification[key] < 5000) {
            return;
        }
        this.lastNotification[key] = now;

        try {
            // Use Telegram's showAlert for important messages
            if (type === 'achievement' || type === 'levelup') {
                WebApp.showAlert(`${title}\n\n${message}`);
            } else {
                // Use showPopup for less intrusive notifications
                WebApp.showPopup({
                    title,
                    message,
                    buttons: [{ type: 'close' }]
                });
            }

            // Haptic feedback
            this.triggerHaptic(type);
        } catch (error) {
            console.error('Notification error:', error);
            // Fallback to browser notification if Telegram fails
            this.showBrowserNotification(title, message);
        }
    }

    // Browser fallback notification
    showBrowserNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/icon.png',
                badge: '/badge.png'
            });
        }
    }

    // Telegram haptic feedback
    triggerHaptic(type) {
        try {
            switch (type) {
                case 'success':
                case 'achievement':
                    WebApp.HapticFeedback.notificationOccurred('success');
                    break;
                case 'error':
                case 'damage':
                    WebApp.HapticFeedback.notificationOccurred('error');
                    break;
                case 'levelup':
                case 'victory':
                    WebApp.HapticFeedback.notificationOccurred('success');
                    setTimeout(() => {
                        WebApp.HapticFeedback.notificationOccurred('success');
                    }, 100);
                    break;
                case 'warning':
                    WebApp.HapticFeedback.notificationOccurred('warning');
                    break;
                default:
                    WebApp.HapticFeedback.impactOccurred('light');
            }
        } catch (error) {
            console.error('Haptic error:', error);
        }
    }

    // Achievement notification with special formatting
    notifyAchievement(title, description, xp = 0) {
        this.showNotification(
            `🏆 ${title}`,
            `${description}${xp > 0 ? `\n\n+${xp} XP` : ''}`,
            'achievement'
        );
    }

    // Level up notification
    notifyLevelUp(newLevel, bandScore) {
        this.showNotification(
            '⭐ LEVEL UP!',
            `You've reached Level ${newLevel}!\nIELTS Band: ${bandScore}`,
            'levelup'
        );
    }

    // Boss defeated notification
    notifyBossDefeated(bossName, xp) {
        this.showNotification(
            '👑 BOSS DEFEATED!',
            `You defeated ${bossName}!\n\n+${xp} XP`,
            'victory'
        );
    }

    // Daily streak notification
    notifyDailyStreak(days) {
        this.showNotification(
            '🔥 Streak Bonus!',
            `${days} day streak! Keep it up!`,
            'success'
        );
    }

    // Equipment unlocked
    notifyEquipmentUnlocked(itemName, rarity) {
        this.showNotification(
            '⚔️ Equipment Unlocked!',
            `${itemName} (${rarity})`,
            'achievement'
        );
    }

    // Band score improvement
    notifyBandImprovement(oldBand, newBand) {
        this.showNotification(
            '📈 Band Score Improved!',
            `${oldBand} → ${newBand}`,
            'levelup'
        );
    }

    // Request notification permission (browser)
    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Singleton instance
const notificationManager = new NotificationManager();

// Request permission on load
if (typeof window !== 'undefined') {
    notificationManager.requestPermission();
}

export default notificationManager;
