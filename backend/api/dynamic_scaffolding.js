// ========== DYNAMIC SCAFFOLDING GOVERNOR (DSG) ==========
// Brain Evolution Step 4: Real-time Cognitive Load Management

/**
 * POST /api/dsg/record-metrics
 * Records cognitive load metrics from frontend
 */
async function handleRecordMetrics(request, env, corsHeaders) {
    try {
        const {
            user_id,
            mission_id,
            mission_type,
            typing_metrics,
            voice_metrics,
            heart_rate
        } = await request.json();

        if (!user_id) {
            return new Response(JSON.stringify({ error: 'user_id required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Calculate Hesitation Index (0.0 - 1.0)
        let hesitationIndex = 0.0;

        if (typing_metrics) {
            // Typing hesitation: >5000ms pause = high load
            const typingLoad = Math.min(typing_metrics.max_pause_duration_ms / 10000, 1.0);
            const backspaceLoad = Math.min(typing_metrics.backspace_frequency / 50, 1.0);
            hesitationIndex = (typingLoad + backspaceLoad) / 2;
        }

        if (voice_metrics) {
            // Voice hesitation: >2000ms pauses, >5 filler words = high load
            const pauseLoad = Math.min(voice_metrics.avg_hesitation_duration_ms / 4000, 1.0);
            const fillerLoad = Math.min(voice_metrics.filler_word_count / 10, 1.0);
            const pitchLoad = 1.0 - Math.min(voice_metrics.pitch_variance || 0, 1.0); // Low variance = nervous/monotone
            hesitationIndex = (pauseLoad + fillerLoad + pitchLoad) / 3;
        }

        // Store metrics
        await env.DB.prepare(`
            INSERT INTO cognitive_load_metrics
            (user_id, mission_id, mission_type, 
             avg_typing_latency_ms, max_pause_duration_ms, backspace_frequency,
             avg_hesitation_duration_ms, filler_word_count, speech_rate_wpm, pitch_variance,
             hesitation_index, heart_rate_bpm, recorded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            user_id,
            mission_id || null,
            mission_type || 'unknown',
            typing_metrics?.avg_typing_latency_ms || null,
            typing_metrics?.max_pause_duration_ms || null,
            typing_metrics?.backspace_frequency || null,
            voice_metrics?.avg_hesitation_duration_ms || null,
            voice_metrics?.filler_word_count || null,
            voice_metrics?.speech_rate_wpm || null,
            voice_metrics?.pitch_variance || null,
            hesitationIndex,
            heart_rate || null,
            new Date().toISOString()
        ).run();

        return new Response(JSON.stringify({
            success: true,
            hesitation_index: hesitationIndex,
            cognitive_load: hesitationIndex > 0.7 ? 'high' : hesitationIndex > 0.4 ? 'moderate' : 'low'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Record Metrics Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * POST /api/dsg/get-intervention
 * Returns scaffolding hints based on current cognitive load
 */
async function handleGetIntervention(request, env, corsHeaders) {
    try {
        const { user_id, mission_id, mission_type, current_prompt } = await request.json();

        if (!user_id) {
            return new Response(JSON.stringify({ error: 'user_id required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get recent cognitive load
        const recentMetrics = await env.DB.prepare(`
            SELECT hesitation_index
            FROM cognitive_load_metrics
            WHERE user_id = ? AND mission_id = ?
            ORDER BY recorded_at DESC
            LIMIT 1
        `).bind(user_id, mission_id).first();

        const hesitationIndex = recentMetrics?.hesitation_index || 0.0;

        // Check if intervention is needed
        if (hesitationIndex < 0.7) {
            return new Response(JSON.stringify({
                intervention_needed: false,
                hesitation_index: hesitationIndex,
                message: 'User performing well, no scaffolding needed'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get user's current scaffold visibility levels
        let userProgress = await env.DB.prepare(`
            SELECT sentence_starter_visibility, word_bank_visibility
            FROM user_scaffold_progress
            WHERE user_id = ?
        `).bind(user_id).first();

        if (!userProgress) {
            // Initialize if not exists
            await env.DB.prepare(`
                INSERT INTO user_scaffold_progress
                (user_id, sentence_starter_visibility, word_bank_visibility)
                VALUES (?, 1.0, 1.0)
            `).bind(user_id).run();
            userProgress = { sentence_starter_visibility: 1.0, word_bank_visibility: 1.0 };
        }

        // Generate appropriate scaffolding
        let interventionContent = {};
        let interventionType = '';

        if (mission_type === 'speaking' || mission_type === 'writing') {
            // Generate sentence starters using Gemini
            const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{
                            text: `Generate 3 natural IELTS-appropriate sentence starters for the given prompt.
                            
Return ONLY a JSON array of strings:
["In my opinion,", "I believe that", "From my perspective,"]

No markdown, no explanation.`
                        }]
                    },
                    contents: [{
                        parts: [{
                            text: `Prompt: ${current_prompt || 'Discuss your views on technology in education.'}\n\nGenerate 3 sentence starters.`
                        }]
                    }]
                })
            });

            if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json();
                const text = geminiData.candidates[0].content.parts[0].text;
                const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/);
                const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
                const starters = JSON.parse(jsonString);

                interventionContent.sentence_starters = starters;
                interventionType = 'sentence_starters';
            }
        }

        // Log intervention
        await env.DB.prepare(`
            INSERT INTO scaffold_interventions
            (user_id, mission_id, triggered_by_metric, metric_value, threshold_exceeded,
             intervention_type, intervention_content, visibility_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            user_id,
            mission_id || null,
            'hesitation_index',
            hesitationIndex,
            0.7,
            interventionType,
            JSON.stringify(interventionContent),
            userProgress.sentence_starter_visibility
        ).run();

        return new Response(JSON.stringify({
            intervention_needed: true,
            intervention_type: interventionType,
            intervention_content: interventionContent,
            visibility_level: userProgress.sentence_starter_visibility,
            hesitation_index: hesitationIndex,
            message: '🛡️ Scaffolding activated! Use these hints to overcome the challenge.'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get Intervention Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * POST /api/dsg/success-feedback
 * Reduces scaffold visibility by 20% after successful completion
 */
async function handleSuccessFeedback(request, env, corsHeaders) {
    try {
        const { user_id, intervention_id, mission_completed } = await request.json();

        if (!user_id || !mission_completed) {
            return new Response(JSON.stringify({ error: 'user_id and mission_completed required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Update intervention record
        if (intervention_id) {
            await env.DB.prepare(`
                UPDATE scaffold_interventions
                SET user_completed_mission = 1
                WHERE id = ?
            `).bind(intervention_id).run();
        }

        // Get current intervention type
        const intervention = await env.DB.prepare(`
            SELECT intervention_type
            FROM scaffold_interventions
            WHERE id = ?
        `).bind(intervention_id).first();

        if (!intervention) {
            return new Response(JSON.stringify({ error: 'Intervention not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Reduce visibility by 20%
        const visibilityField = intervention.intervention_type === 'sentence_starters'
            ? 'sentence_starter_visibility'
            : 'word_bank_visibility';

        const successField = intervention.intervention_type === 'sentence_starters'
            ? 'sentence_starter_successes'
            : 'word_bank_successes';

        await env.DB.prepare(`
            UPDATE user_scaffold_progress
            SET ${visibilityField} = MAX(0.0, ${visibilityField} - 0.2),
                ${successField} = ${successField} + 1,
                autonomy_score = MIN(1.0, autonomy_score + 0.05),
                last_updated = ?
            WHERE user_id = ?
        `).bind(new Date().toISOString(), user_id).run();

        // Get updated progress
        const updatedProgress = await env.DB.prepare(`
            SELECT sentence_starter_visibility, autonomy_score
            FROM user_scaffold_progress
            WHERE user_id = ?
        `).bind(user_id).first();

        return new Response(JSON.stringify({
            success: true,
            new_visibility: updatedProgress?.sentence_starter_visibility || 0.8,
            autonomy_score: updatedProgress?.autonomy_score || 0.05,
            message: updatedProgress?.sentence_starter_visibility === 0
                ? '🎓 Scaffolding removed! You\'re ready to perform unaided!'
                : '⬆️ You\'re getting stronger! Scaffolding fading...'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Success Feedback Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export {
    handleRecordMetrics,
    handleGetIntervention,
    handleSuccessFeedback
};
