/**
 * Sentence Architect Mini-Game Validation
 * Implements "The Clause Connector" drag-and-drop logic
 */

export async function handleMiniGameValidate(request, env, corsHeaders) {
    try {
        const { userId, sequence, gameId } = await request.json();

        if (!userId || !sequence) {
            return new Response(JSON.stringify({ error: "userId and sequence required" }), { status: 400, headers: corsHeaders });
        }

        // sequence looks like: ["DEPENDENT", "INDEPENDENT", "MODIFIER"]
        const validPatterns = [
            ["DEPENDENT", "INDEPENDENT", "MODIFIER"], // Complex-Compound
            ["MODIFIER", "INDEPENDENT", "DEPENDENT"], // Formal/Academic
            ["INDEPENDENT", "DEPENDENT", "MODIFIER"], // Natural flow
            ["DEPENDENT", "MODIFIER", "INDEPENDENT"]  // Advanced emphasis
        ];

        const isCorrect = validPatterns.some(p => JSON.stringify(p) === JSON.stringify(sequence));

        if (isCorrect) {
            // 1. Award Momentum Surge for clearing "Boss Level"
            await env.DB.prepare(`
                UPDATE users SET 
                    momentum_score = MIN(100, momentum_score + 20),
                    boss_level_cleared = 1,
                    last_active = datetime('now')
                WHERE user_id = ?
            `).bind(userId).run();

            return new Response(JSON.stringify({
                success: true,
                auraFeedback: "Brilliant. You just mastered the 'Contrast' structure! That's Band 7.5+ architecture.",
                momentumBoost: +20
            }), { headers: corsHeaders });
        }

        return new Response(JSON.stringify({
            success: false,
            hint: "Aura: Try starting with the 'Although' (DEPENDENT) block to create a stronger contrast."
        }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}
