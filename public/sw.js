// Service Worker for IELTS Reading Mastery
// Provides offline support and caching for Uzbekistan market

const CACHE_NAME = 'ielts-mastery-v1';
const RUNTIME_CACHE = 'ielts-runtime-v1';

// Critical assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    // Will be populated during build
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // API requests - Network first, cache fallback
    if (url.pathname.startsWith('/api')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful API responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(request).then((cached) => {
                        if (cached) {
                            console.log('[SW] Serving API from cache:', url.pathname);
                            return cached;
                        }
                        // Return offline response
                        return new Response(
                            JSON.stringify({
                                offline: true,
                                message: 'You are offline. Changes will sync when online.'
                            }),
                            {
                                headers: { 'Content-Type': 'application/json' },
                                status: 503
                            }
                        );
                    });
                })
        );
        return;
    }

    // Static assets - Cache first, network fallback
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) {
                console.log('[SW] Serving from cache:', url.pathname);
                return cached;
            }

            return fetch(request).then((response) => {
                // Cache new assets
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            });
        })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-queue') {
        console.log('[SW] Background sync triggered');
        event.waitUntil(
            // Notify app to sync offline queue
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'SYNC_OFFLINE_QUEUE',
                    });
                });
            })
        );
    }
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
