/**
 * Onboarding API Handler
 * Implements "The First Flight" with KV-based state persistence
 */

export async function handleOnboarding(request, env, corsHeaders) {
    try {
        const { userId, step, data } = await request.json();

        if (!userId) {
            return new Response(JSON.stringify({ error: "userId required" }), { status: 400, headers: corsHeaders });
        }

        const kvKey = `onboarding:${userId}`;

        // Step 1: Initialize dialogue
        if (step === 'INIT') {
            return new Response(JSON.stringify({
                message: "Aura: Welcome to the Frontier! 🛰️ I'm Aura. Before we fly, tell me: when is your target IELTS date?",
                nextStep: 'SET_DATE'
            }), { headers: corsHeaders });
        }

        // Step 2: Save metadata to KV (Fatigue Protection)
        if (step === 'SET_DATE') {
            const onboardingState = {
                targetDate: data.targetDate,
                step: 'DIAGNOSTIC_PENDING',
                updatedAt: Date.now()
            };
            await env.DRAFTS_KV.put(kvKey, JSON.stringify(onboardingState), { expirationTtl: 3600 });

            return new Response(JSON.stringify({
                message: "Perfect. Now, just three sentences: Why are you learning English? (This initializes your diagnostic baseline).",
                nextStep: 'SUBMIT_DIAGNOSTIC'
            }), { headers: corsHeaders });
        }

        // Step 3: Complete Onboarding & Persist to D1
        if (step === 'SUBMIT_DIAGNOSTIC') {
            const stateData = await env.DRAFTS_KV.get(kvKey);
            const state = stateData ? JSON.parse(stateData) : {};

            await env.DB.prepare(`
                UPDATE users SET 
                    target_date = ?, 
                    momentum_score = 100.0,
                    onboarding_status = 'COMPLETED'
                WHERE user_id = ?
            `).bind(state.targetDate || null, userId).run();

            // Clear KV
            await env.DRAFTS_KV.delete(kvKey);

            return new Response(JSON.stringify({
                success: true,
                message: "Baseline set! Your momentum is 100%. Welcome explorer.",
                momentum: 100.0
            }), { headers: corsHeaders });
        }

    } catch (error) {
        console.error("Onboarding error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}
