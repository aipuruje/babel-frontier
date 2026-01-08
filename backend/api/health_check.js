/**
 * Health Check Script (Master Guide Implementation)
 * Verifies D1 (Database), R2 (Storage), and AI (Gateway) connectivity.
 */
export async function handleHealthCheck(request, env, corsHeaders) {
    const checks = {
        d1: false,
        r2: false,
        ai: false
    };

    try {
        // 1. D1 Health: Can we read?
        if (env.DB) {
            const dbCheck = await env.DB.prepare("SELECT 1 as test").first();
            checks.d1 = dbCheck && dbCheck.test === 1;
        }

        // 2. R2 Health: Can we list objects?
        if (env.AUDIO_BUCKET) {
            await env.AUDIO_BUCKET.list({ limit: 1 });
            checks.r2 = true;
        }

        // 3. AI Health: Check if API key is configured
        // Note: We check key existence rather than making actual API calls
        // to avoid quota usage and latency on health checks
        if (env.GEMINI_API_KEY) {
            checks.ai = env.GEMINI_API_KEY.length > 0;
        }

        const allOk = Object.values(checks).every(Boolean);
        return new Response(JSON.stringify({
            status: allOk ? "HEALTHY" : "DEGRADED",
            checks,
            timestamp: new Date().toISOString()
        }), {
            status: allOk ? 200 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (e) {
        return new Response(JSON.stringify({
            status: "CRITICAL_FAILURE",
            error: e.message,
            checks
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
