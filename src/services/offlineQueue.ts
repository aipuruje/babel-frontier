/**
 * Enhanced Offline Queue with Retry Logic
 * Optimized for Uzbekistan network conditions
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface QueueAction {
    id: string;
    type: 'progress' | 'battle' | 'xp' | 'profile' | 'analytics';
    endpoint: string;
    method: 'POST' | 'PUT' | 'PATCH';
    data: any;
    timestamp: number;
    retries: number;
    lastRetry?: number;
}

interface OfflineDB extends DBSchema {
    queue: {
        key: string;
        value: QueueAction;
        indexes: { 'by-timestamp': number };
    };
}

class OfflineQueueManager {
    private db: IDBPDatabase<OfflineDB> | null = null;
    private syncInProgress = false;
    private maxRetries = 5;
    private retryDelays = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff

    /**
     * Initialize the IndexedDB database
     */
    async init(): Promise<void> {
        this.db = await openDB<OfflineDB>('ielts-offline-queue', 1, {
            upgrade(db) {
                const store = db.createObjectStore('queue', { keyPath: 'id' });
                store.createIndex('by-timestamp', 'timestamp');
            },
        });

        // Listen for online/offline events
        window.addEventListener('online', () => this.onOnline());
        window.addEventListener('offline', () => this.onOffline());

        // Listen for service worker sync requests
        window.addEventListener('sw-sync-request', () => this.syncQueue());

        // Initial sync if online
        if (navigator.onLine) {
            this.syncQueue();
        }
    }

    /**
     * Add action to offline queue
     */
    async addToQueue(action: Omit<QueueAction, 'id' | 'timestamp' | 'retries'>): Promise<void> {
        if (!this.db) await this.init();

        const queueAction: QueueAction = {
            ...action,
            id: `${action.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            retries: 0,
        };

        await this.db!.add('queue', queueAction);
        console.log('[OfflineQueue] Action queued:', queueAction.type);

        // Try to sync immediately if online
        if (navigator.onLine) {
            this.syncQueue();
        }
    }

    /**
     * Get all pending actions
     */
    async getPendingActions(): Promise<QueueAction[]> {
        if (!this.db) await this.init();
        return this.db!.getAllFromIndex('queue', 'by-timestamp');
    }

    /**
     * Get queue count
     */
    async getQueueCount(): Promise<number> {
        if (!this.db) await this.init();
        return this.db!.count('queue');
    }

    /**
     * Sync queue when online
     */
    async syncQueue(): Promise<void> {
        if (!navigator.onLine || this.syncInProgress) {
            return;
        }

        this.syncInProgress = true;
        console.log('[OfflineQueue] Starting sync...');

        try {
            const actions = await this.getPendingActions();
            console.log(`[OfflineQueue] ${actions.length} actions to sync`);

            for (const action of actions) {
                try {
                    await this.syncAction(action);
                    // Success - remove from queue
                    await this.db!.delete('queue', action.id);
                    console.log('[OfflineQueue] Synced:', action.type);
                } catch (error) {
                    console.error('[OfflineQueue] Sync failed:', action.type, error);

                    // Retry logic
                    action.retries++;
                    action.lastRetry = Date.now();

                    if (action.retries < this.maxRetries) {
                        // Update retry count
                        await this.db!.put('queue', action);
                        console.log(`[OfflineQueue] Will retry (${action.retries}/${this.maxRetries})`);
                    } else {
                        // Max retries exceeded - remove from queue
                        await this.db!.delete('queue', action.id);
                        console.error('[OfflineQueue] Max retries exceeded, removing:', action.id);

                        // Notify user
                        this.notifyFailure(action);
                    }
                }
            }

            const remaining = await this.getQueueCount();
            if (remaining > 0) {
                // Schedule retry for failed actions
                setTimeout(() => this.syncQueue(), this.retryDelays[0]);
            } else {
                console.log('[OfflineQueue] Sync complete');
                this.notifySuccess();
            }
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync individual action to backend
     */
    private async syncAction(action: QueueAction): Promise<void> {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const url = `${apiBaseUrl}${action.endpoint}`;

        const response = await fetch(url, {
            method: action.method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(action.data),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Handle online event
     */
    private onOnline(): void {
        console.log('[OfflineQueue] Connection restored');
        this.syncQueue();
    }

    /**
     * Handle offline event
     */
    private onOffline(): void {
        console.log('[OfflineQueue] Connection lost - queueing enabled');
    }

    /**
     * Notify user of successful sync
     */
    private notifySuccess(): void {
        window.dispatchEvent(new CustomEvent('offline-queue-synced'));
    }

    /**
     * Notify user of sync failure
     */
    private notifyFailure(action: QueueAction): void {
        window.dispatchEvent(new CustomEvent('offline-queue-failed', {
            detail: { action },
        }));
    }

    /**
     * Clear all queued actions (for testing/debugging)
     */
    async clearQueue(): Promise<void> {
        if (!this.db) await this.init();
        await this.db!.clear('queue');
        console.log('[OfflineQueue] Queue cleared');
    }
}

// Singleton instance
export const offlineQueue = new OfflineQueueManager();

// Initialize on module load
offlineQueue.init();
