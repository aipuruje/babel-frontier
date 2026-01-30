/**
 * Telegram WebApp Utilities
 * Helper functions for integrating with Telegram Mini App SDK
 */

import type { TelegramWebApp } from '@/types';

/**
 * Get Telegram WebApp instance
 * Returns null if not running in Telegram environment
 */
export const getTelegramWebApp = (): TelegramWebApp | null => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        return window.Telegram.WebApp;
    }
    return null;
};

/**
 * Initialize Telegram WebApp
 * Should be called once on app startup
 */
export const initTelegramWebApp = (): TelegramWebApp | null => {
    const telegram = getTelegramWebApp();

    if (telegram) {
        // Signal that the app is ready
        telegram.ready();

        // Expand to full height
        telegram.expand();

        // Set header and background colors
        telegram.headerColor = '#0f172a';
        telegram.backgroundColor = '#0f172a';

        // Enable closing confirmation
        telegram.enableClosingConfirmation();

        console.log('Telegram WebApp initialized:', {
            version: telegram.version,
            platform: telegram.platform,
            colorScheme: telegram.colorScheme,
            user: telegram.initDataUnsafe.user
        });
    } else {
        console.warn('Telegram WebApp SDK not available. Running in browser mode.');
    }

    return telegram;
};

/**
 * Get current Telegram user
 * Returns mock user in development mode for browser testing
 */
export const getTelegramUser = () => {
    const telegram = getTelegramWebApp();
    const telegramUser = telegram?.initDataUnsafe.user;

    // Return actual Telegram user if available
    if (telegramUser) {
        return telegramUser;
    }

    // Development mode fallback for browser testing
    // IMPORTANT: Only return mock data if BOTH conditions are true:
    // 1. Running in development mode
    // 2. No real Telegram user data available
    if (import.meta.env.DEV && !telegramUser) {
        console.warn('[Telegram] Using mock user data (development mode only)');
        return {
            id: 123456789,
            first_name: 'Test',
            last_name: 'User',
            username: 'testuser',
            language_code: 'en',
            is_premium: false
        };
    }

    // Production mode without Telegram - provide demo user for browser testing
    // This allows the deployed app to be previewed in a regular browser
    if (import.meta.env.PROD && !telegramUser) {
        console.warn('[Telegram] Running in browser mode - using demo user');
        return {
            id: 999999999,
            first_name: 'Demo',
            last_name: 'User',
            username: 'demo_user',
            language_code: 'en',
            is_premium: false
        };
    }

    return null;
};

/**
 * Check if running in Telegram
 */
export const isRunningInTelegram = (): boolean => {
    return getTelegramWebApp() !== null;
};

/**
 * Trigger haptic feedback
 */
export const triggerHaptic = (
    type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection' = 'light'
): void => {
    const telegram = getTelegramWebApp();

    if (!telegram) return;

    switch (type) {
        case 'selection':
            telegram.HapticFeedback.selectionChanged();
            break;
        case 'success':
        case 'warning':
        case 'error':
            telegram.HapticFeedback.notificationOccurred(type);
            break;
        default:
            telegram.HapticFeedback.impactOccurred(type);
    }
};

/**
 * Show Telegram alert
 */
export const showAlert = (message: string, callback?: () => void): void => {
    const telegram = getTelegramWebApp();

    if (telegram) {
        telegram.showAlert(message, callback);
    } else {
        alert(message);
        callback?.();
    }
};

/**
 * Show Telegram confirmation dialog
 */
export const showConfirm = (message: string): Promise<boolean> => {
    const telegram = getTelegramWebApp();

    return new Promise((resolve) => {
        if (telegram) {
            telegram.showConfirm(message, resolve);
        } else {
            resolve(confirm(message));
        }
    });
};

/**
 * Open link in external browser
 */
export const openLink = (url: string, tryInstantView = false): void => {
    const telegram = getTelegramWebApp();

    if (telegram) {
        telegram.openLink(url, { try_instant_view: tryInstantView });
    } else {
        window.open(url, '_blank');
    }
};

/**
 * Control Main Button (bottom CTA button in Telegram)
 */
export const setMainButton = (config: {
    text: string;
    onClick: () => void;
    show?: boolean;
    enable?: boolean;
    showProgress?: boolean;
}): void => {
    const telegram = getTelegramWebApp();

    if (!telegram) return;

    const { MainButton } = telegram;

    MainButton.setText(config.text);
    MainButton.onClick(config.onClick);

    if (config.show !== false) {
        MainButton.show();
    }

    if (config.enable !== false) {
        MainButton.enable();
    } else {
        MainButton.disable();
    }

    if (config.showProgress) {
        MainButton.showProgress();
    } else {
        MainButton.hideProgress();
    }
};

/**
 * Hide Main Button
 */
export const hideMainButton = (): void => {
    const telegram = getTelegramWebApp();
    telegram?.MainButton.hide();
};

/**
 * Control Back Button
 */
export const setBackButton = (onClick: () => void, show = true): void => {
    const telegram = getTelegramWebApp();

    if (!telegram) return;

    const { BackButton } = telegram;

    BackButton.onClick(onClick);

    if (show) {
        BackButton.show();
    } else {
        BackButton.hide();
    }
};

/**
 * Hide Back Button
 */
export const hideBackButton = (): void => {
    const telegram = getTelegramWebApp();
    telegram?.BackButton.hide();
};

/**
 * Share content to Telegram
 */
export const shareToTelegram = (text: string, url?: string): void => {
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url || '')}&text=${encodeURIComponent(text)}`;

    openLink(shareUrl);
};

/**
 * Get theme parameters from Telegram
 */
export const getThemeParams = () => {
    const telegram = getTelegramWebApp();
    return telegram?.themeParams || {};
};

/**
 * Check if user is premium Telegram subscriber
 */
export const isUserPremium = (): boolean => {
    const user = getTelegramUser();
    return user?.is_premium || false;
};

/**
 * Get user language code
 */
export const getUserLanguage = (): string => {
    const user = getTelegramUser();
    return user?.language_code || 'en';
};

/**
 * Validate Telegram init data (for backend authentication)
 */
export const getTelegramInitData = (): string => {
    const telegram = getTelegramWebApp();
    return telegram?.initData || '';
};

/**
 * Close the Mini App
 */
export const closeMiniApp = (): void => {
    const telegram = getTelegramWebApp();
    if (telegram) {
        telegram.close();
    } else {
        window.close();
    }
};

/**
 * Setup Telegram viewport height for proper content display
 * Handles safe areas and stable viewport height
 */
export const setupTelegramViewport = (): (() => void) | undefined => {
    const telegram = getTelegramWebApp();

    if (telegram) {
        const setViewportHeight = () => {
            // Use Telegram's stable viewport height (excludes keyboard)
            const vh = telegram.viewportStableHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            document.documentElement.style.setProperty(
                '--tg-viewport-stable-height',
                `${telegram.viewportStableHeight}px`
            );

            // Set viewport height in pixels for calculations
            document.documentElement.style.setProperty(
                '--tg-viewport-height',
                `${telegram.viewportHeight}px`
            );
        };

        // Set initial values
        setViewportHeight();

        // Update on window resize (Telegram triggers this on viewport changes)
        const handleResize = () => {
            setViewportHeight();
        };

        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }

    // Fallback for browser testing
    const setFallbackVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setFallbackVH();
    window.addEventListener('resize', setFallbackVH);

    return () => window.removeEventListener('resize', setFallbackVH);
};
