/**
 * Service Worker Registration and Management
 * Handles SW lifecycle, updates, and messaging
 */

export interface ServiceWorkerMessage {
    type: string;
    payload?: any;
}

class ServiceWorkerManager {
    private registration: ServiceWorkerRegistration | null = null;
    private updateAvailable = false;
    private updateCheckInterval: number | null = null; // Store interval ID

    /**
     * Register the service worker
     */
    async register(): Promise<void> {
        if (!('serviceWorker' in navigator)) {
            console.warn('[SW] Service Workers not supported');
            return;
        }

        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
            });

            console.log('[SW] Service Worker registered:', this.registration.scope);

            // Check for updates
            this.registration.addEventListener('updatefound', () => {
                const newWorker = this.registration?.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New service worker available
                        this.updateAvailable = true;
                        console.log('[SW] Update available');
                        this.notifyUpdateAvailable();
                    }
                });
            });

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));

            // Check for updates periodically (every 1 hour)
            this.updateCheckInterval = window.setInterval(() => {
                this.registration?.update();
            }, 60 * 60 * 1000);

        } catch (error) {
            console.error('[SW] Registration failed:', error);
        }
    }

    /**
     * Handle messages from service worker
     */
    private handleMessage(event: MessageEvent<ServiceWorkerMessage>): void {
        const { type } = event.data;

        switch (type) {
            case 'SYNC_OFFLINE_QUEUE':
                // Trigger offline queue sync
                window.dispatchEvent(new CustomEvent('sw-sync-request'));
                break;

            default:
                console.log('[SW] Unknown message type:', type);
        }
    }

    /**
     * Notify user about available update
     */
    private notifyUpdateAvailable(): void {
        const event = new CustomEvent('sw-update-available');
        window.dispatchEvent(event);
    }

    /**
     * Skip waiting and activate new service worker
     */
    async skipWaiting(): Promise<void> {
        if (!this.registration?.waiting) return;

        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Reload page when new SW activates
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
    }

    /**
     * Unregister service worker (for development)
     */
    async unregister(): Promise<void> {
        if (!this.registration) return;

        // Clear update check interval
        if (this.updateCheckInterval !== null) {
            window.clearInterval(this.updateCheckInterval);
            this.updateCheckInterval = null;
        }

        await this.registration.unregister();
        console.log('[SW] Service Worker unregistered');
    }

    /**
     * Request background sync
     */
    async requestBackgroundSync(tag: string = 'sync-offline-queue'): Promise<void> {
        if (!this.registration) {
            console.warn('[SW] No registration available');
            return;
        }

        // Check if sync is available
        if (!('sync' in this.registration)) {
            console.warn('[SW] Background Sync not supported');
            return;
        }

        try {
            // Type assertion for sync API
            await (this.registration as any).sync.register(tag);
            console.log('[SW] Background sync requested:', tag);
        } catch (error) {
            console.error('[SW] Background sync failed:', error);
        }
    }

    /**
     * Check if update is available
     */
    isUpdateAvailable(): boolean {
        return this.updateAvailable;
    }

    /**
     * Get current registration
     */
    getRegistration(): ServiceWorkerRegistration | null {
        return this.registration;
    }
}

// Singleton instance
export const swManager = new ServiceWorkerManager();

/**
 * Initialize service worker on app start
 */
export async function initializeServiceWorker(): Promise<void> {
    // Only register in production or when explicitly enabled
    const isDev = import.meta.env.DEV;
    const forceEnable = import.meta.env.VITE_ENABLE_SW === 'true';

    if (isDev && !forceEnable) {
        console.log('[SW] Skipped in development mode');
        return;
    }

    try {
        await swManager.register();
    } catch (error) {
        console.error('[SW] Initialization failed:', error);
    }
}
