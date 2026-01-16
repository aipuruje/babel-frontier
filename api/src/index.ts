import { Env } from './types';
import { Router } from 'itty-router';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/user';
import { progressRoutes } from './routes/progress';
import { analyticsRoutes } from './routes/analytics';
import { corsHeaders } from './utils/cors';

const router = Router();

// CORS preflight
router.options('*', () => new Response(null, { headers: corsHeaders }));

// Health check
router.get('/api/health', () => {
    return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
});

// Mount route modules
router.all('/api/auth/*', authRoutes);
router.all('/api/user/*', userRoutes);
router.all('/api/progress/*', progressRoutes);
router.all('/api/analytics/*', analyticsRoutes);

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404, headers: corsHeaders }));

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        try {
            return await router.handle(request, env, ctx);
        } catch (error) {
            console.error('Worker error:', error);
            return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};
