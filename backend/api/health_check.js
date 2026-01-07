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
            const dbCheck = await env.DB.prepare("PRAGMA quick_check").get();
            checks.d1 = dbCheck.quick_check === "ok";
        }

        // 2. R2 Health: Can we list objects?
        if (env.AUDIO_BUCKET) {
            await env.AUDIO_BUCKET.list({ limit: 1 });
            checks.r2 = true;
        }

        // 3. AI Health: Is the Gateway responsive? (Gemini check as we migrated from Llama)
        if (env.GEMINI_API_KEY) {
            const aiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
            });
            checks.ai = aiRes.ok;
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
