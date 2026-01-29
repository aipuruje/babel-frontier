/**
 * Sync Queue - Offline-first data synchronization
 * 
 * Queues failed API requests and retries them when online.
 * Uses localStorage for persistence (IndexedDB would be better for production).
 */

export interface QueuedRequest {
    id: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: any;
    timestamp: number;
    retries: number;
}

const QUEUE_KEY = 'api_sync_queue';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES_PER_REQUEST = 5;

class SyncQueue {
    private queue: QueuedRequest[] = [];
    private processing = false;

    constructor() {
        this.loadQueue();
        this.startAutoSync();
    }

    /**
     * Load queue from localStorage
     */
    private loadQueue(): void {
        try {
            const stored = localStorage.getItem(QUEUE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load sync queue:', error);
            this.queue = [];
        }
    }

    /**
     * Save queue to localStorage
     */
    private saveQueue(): void {
        try {
            localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
        } catch (error) {
            console.error('Failed to save sync queue:', error);
        }
    }

    /**
     * Add request to queue
     */
    enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): void {
        const queuedRequest: QueuedRequest = {
            ...request,
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            retries: 0,
        };

        this.queue.push(queuedRequest);

        // Limit queue size
        if (this.queue.length > MAX_QUEUE_SIZE) {
            this.queue.shift(); // Remove oldest
        }

        this.saveQueue();
    }

    /**
     * Process the queue
     */
    async processQueue(): Promise<void> {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        const failedRequests: QueuedRequest[] = [];

        for (const request of this.queue) {
            try {
                await this.retryRequest(request);
            } catch (error) {
                console.error('Failed to sync request:', error);

                // Increment retry count
                request.retries++;

                // Keep in queue if under max retries
                if (request.retries < MAX_RETRIES_PER_REQUEST) {
                    failedRequests.push(request);
                } else {
                    console.warn('Max retries reached for request:', request.id);
                }
            }
        }

        // Update queue with only failed requests
        this.queue = failedRequests;
        this.saveQueue();
        this.processing = false;
    }

    /**
     * Retry a single request
     */
    private async retryRequest(request: QueuedRequest): Promise<void> {
        const { apiClient } = await import('./api');

        switch (request.method) {
            case 'GET':
                await apiClient.get(request.endpoint);
                break;
            case 'POST':
                await apiClient.post(request.endpoint, request.data);
                break;
            case 'PUT':
                await apiClient.put(request.endpoint, request.data);
                break;
            case 'PATCH':
                await apiClient.patch(request.endpoint, request.data);
                break;
            case 'DELETE':
                await apiClient.delete(request.endpoint);
                break;
        }
    }

    /**
     * Start automatic sync on network reconnection
     */
    private startAutoSync(): void {
        // Sync when online
        window.addEventListener('online', () => {
            console.log('Network reconnected, processing sync queue...');
            this.processQueue();
        });

        // Periodic sync every 5 minutes
        setInterval(() => {
            if (navigator.onLine) {
                this.processQueue();
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Get queue status
     */
    getStatus(): { pending: number; processing: boolean } {
        return {
            pending: this.queue.length,
            processing: this.processing,
        };
    }

    /**
     * Clear the queue (for testing or manual reset)
     */
    clear(): void {
        this.queue = [];
        this.saveQueue();
    }
}

// Singleton instance
export const syncQueue = new SyncQueue();
