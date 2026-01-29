import posthog from 'posthog-js';

/**
 * Initialize PostHog analytics
 */
export function initAnalytics() {
    if (import.meta.env.VITE_POSTHOG_KEY) {
        posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
            api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
            autocapture: false, // Manual tracking for better control
            capture_pageview: false, // We'll track manually
            disable_session_recording: true, // Privacy-focused
            persistence: 'localStorage',
        });
    }
}

/**
 * Track a custom event
 */
export function trackEvent(
    eventName: string,
    properties?: Record<string, any>
) {
    if (import.meta.env.DEV) {
        console.log('[Analytics]', eventName, properties);
    }

    if (import.meta.env.VITE_POSTHOG_KEY) {
        posthog.capture(eventName, properties);
    }
}

/**
 * Identify a user
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
    if (import.meta.env.VITE_POSTHOG_KEY) {
        posthog.identify(userId, properties);
    }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, properties?: Record<string, any>) {
    if (import.meta.env.VITE_POSTHOG_KEY) {
        posthog.capture('$pageview', {
            page: pageName,
            ...properties
        });
    }
}

/**
 * Reset analytics on logout
 */
export function resetAnalytics() {
    if (import.meta.env.VITE_POSTHOG_KEY) {
        posthog.reset();
    }
}
