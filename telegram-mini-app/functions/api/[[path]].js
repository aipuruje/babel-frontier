/**
 * Main API Router for Cloudflare Pages Functions
 * Handles all /api/* requests and routes to appropriate handlers
 */

// Import all backend handlers
import { handleHealthCheck } from '../../../backend/api/health_check.js';

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Route based on pathname
        if (pathname === '/api/health-check') {
            return await handleHealthCheck(request, env, corsHeaders);
        }

        // If no route matches
        return new Response(JSON.stringify({ error: 'Not Found', path: pathname }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
