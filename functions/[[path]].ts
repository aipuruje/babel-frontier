// Cloudflare Pages API endpoint - unified with frontend
import { Env } from '../../api/src/types';
import { Router } from 'itty-router';
import { authRoutes } from '../../api/src/routes/auth';
import { userRoutes } from '../../api/src/routes/user';
import { progressRoutes } from '../../api/src/routes/progress';
import { analyticsRoutes } from '../../api/src/routes/analytics';
import { corsHeaders } from '../../api/src/utils/cors';

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

export const onRequest: PagesFunction<Env> = async (context) => {
    try {
        return await router.handle(context.request, context.env, context);
    } catch (error) {
        console.error('Pages Function error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
};
