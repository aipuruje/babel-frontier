/**
 * _worker.js - Pages Functions Advanced Configuration
 * This file provides bindings configuration for the entire Pages project
 * All Functions will have access to these bindings
 */

export default {
    async fetch(request, env, ctx) {
        // This worker handles _all_ requests to the Pages site
        // We need to route API requests to our handler, and static requests to assets

        const url = new URL(request.url);

        // If it's an API request, route to our API handler
        if (url.pathname.startsWith('/api/')) {
            // Import the API handler dynamically
            const { onRequest } = await import('./functions/api/[[path]].js');
            return onRequest({ request, env, params: {}, waitUntil: ctx.waitUntil.bind(ctx), passThroughOnException: () => { }, next: async () => { } });
        }

        // For all other requests, serve static assets
        return env.ASSETS.fetch(request);
    }
}
