import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking
 */
export function initErrorTracking() {
    if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.init({
            dsn: import.meta.env.VITE_SENTRY_DSN,
            environment: import.meta.env.MODE,
            tracesSampleRate: 0.1, // 10% of transactions for performance monitoring
            enabled: !import.meta.env.DEV, // Disable in development
            beforeSend(event) {
                // Filter out non-critical errors in production
                if (event.level === 'warning' && import.meta.env.PROD) {
                    return null;
                }
                return event;
            },
        });
    }
}

/**
 * Capture an error
 */
export function captureError(
    error: Error,
    context?: Record<string, any>
) {
    console.error('[Error]', error, context);

    if (import.meta.env.VITE_SENTRY_DSN && !import.meta.env.DEV) {
        Sentry.captureException(error, { extra: context });
    }
}

/**
 * Capture a message
 */
export function captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: Record<string, any>
) {
    if (import.meta.env.VITE_SENTRY_DSN && !import.meta.env.DEV) {
        Sentry.captureMessage(message, {
            level,
            extra: context,
        });
    }
}

/**
 * Set user context for error tracking
 */
export function setErrorUser(userId: string, properties?: Record<string, any>) {
    if (import.meta.env.VITE_SENTRY_DSN && !import.meta.env.DEV) {
        Sentry.setUser({
            id: userId,
            ...properties,
        });
    }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, any>
) {
    if (import.meta.env.VITE_SENTRY_DSN && !import.meta.env.DEV) {
        Sentry.addBreadcrumb({
            message,
            category,
            data,
            level: 'info',
        });
    }
}
