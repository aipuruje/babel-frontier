/**
 * Dynamic Mission Routing
 * Serves REMEDIATION missions if a score drop is detected
 */

export async function handleNextMission(request, env, corsHeaders) {
    try {
        const { userId } = await request.json();

        // 1. Fetch performance history
        const history = await env.DB.prepare(`
            SELECT rounded_band, raw_score FROM progress_history 
            WHERE user_id = ? AND skill_domain = 'writing'
            ORDER BY id DESC LIMIT 2
        `).bind(userId).all();

        const latest = history.results[0];
        const previous = history.results[1];

        // 2. Intercept: Low Momentum Alarm
        const user = await env.DB.prepare(`SELECT momentum_score FROM users WHERE user_id = ?`).bind(userId).first();
        if (user && user.momentum_score < 40) {
            return new Response(JSON.stringify({
                type: 'MOMENTUM_BOOST',
                missionName: 'Frontier Flashpoint',
                message: "Aura: Your energy levels are low! Let's hit a quick 'Momentum Boost' mission to clear the fog. ⚡"
            }), { headers: corsHeaders });
        }

        // 3. Detect "Boss Level" (Score Drop)
        if (latest && previous) {
            const delta = latest.rounded_band - previous.rounded_band;

            if (delta <= -0.3) {
                // Find weakest pillar
                const sub = await env.DB.prepare(`
                    SELECT feedback_json FROM submissions 
                    WHERE user_id = ? AND status = 'completed'
                    ORDER BY completed_at DESC LIMIT 1
                `).bind(userId).first();

                const feedback = JSON.parse(sub.feedback_json);
                const metadata = feedback.aura_metadata; // Stance should be THE_RECOVERY_PIVOT

                // Logic to serve remediation mission
                return new Response(JSON.stringify({
                    type: 'REMEDIATION',
                    pillar: 'CC', // Mock: dynamic mapping based on feedback needed
                    missionName: 'The Logic Bridge',
                    message: "Aura: That mission was a challenge. Let's head to the 'Logic Bridge' to fix our Cohesion."
                }), { headers: corsHeaders });
            }
        }

        // 3. Fallback to standard mission
        return new Response(JSON.stringify({
            type: 'STANDARD',
            message: "Standard mission ready."
        }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}
