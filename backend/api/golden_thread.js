// ========== GOLDEN THREAD TRACKER ==========
// Brain Evolution Step 4: Passive-to-Active Language Conversion

/**
 * POST /api/golden-thread/extract
 * Analyzes completed reading/listening missions and extracts 3 target phrases
 */
async function handleGoldenThreadExtract(request, env, corsHeaders) {
    try {
        const { user_id, mission_id, mission_type, full_content, title } = await request.json();

        if (!user_id || !full_content) {
            return new Response(JSON.stringify({ error: 'user_id and full_content required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Call Gemini to extract high-value phrases
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{
                        text: `You are a linguistic feature extraction expert for IELTS preparation.
                        
Extract exactly 3 high-value target phrases from the given text that a user should actively deploy in their speaking/writing.

Prioritize:
- Band 7+ collocations (e.g., "play a pivotal role", "shed light on")
- Complex subordination structures (e.g., "despite the fact that", "notwithstanding")
- Discourse markers (e.g., "with regard to", "it is worth noting that")
- Natural English phrases that cannot be constructed by direct translation

Return ONLY a JSON array with this structure:
[
  {
    "target_phrase": "play a pivotal role",
    "phrase_type": "collocation",
    "band_value": 7.5,
    "original_context": "The full sentence containing this phrase from the source text"
  }
]

No markdown, no explanation.`
                    }]
                },
                contents: [{
                    parts: [{
                        text: `Source Text:\n\n${full_content}\n\nExtract 3 target phrases as JSON array.`
                    }]
                }]
            })
        });

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API Error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        const text = geminiData.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
        const phrases = JSON.parse(jsonString);

        // Store in active_memory_buffer with 4-hour TTL
        const capturedAt = new Date();
        const expiresAt = new Date(capturedAt.getTime() + 4 * 60 * 60 * 1000); // +4 hours

        const bufferIds = [];
        for (const phrase of phrases) {
            const result = await env.DB.prepare(`
                INSERT INTO active_memory_buffer 
                (user_id, source_mission_id, source_mission_type, target_phrase, phrase_type, band_value, original_context, source_content_title, captured_at, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                user_id,
                mission_id || null,
                mission_type || 'reading',
                phrase.target_phrase,
                phrase.phrase_type,
                phrase.band_value || 6.0,
                phrase.original_context,
                title || 'Untitled Content',
                capturedAt.toISOString(),
                expiresAt.toISOString()
            ).run();

            bufferIds.push(result.meta.last_row_id);
        }

        return new Response(JSON.stringify({
            success: true,
            phrases_extracted: phrases.length,
            phrases: phrases,
            buffer_ids: bufferIds,
            expires_at: expiresAt.toISOString(),
            message: `${phrases.length} Charged Spells added to your Arsenal! Use them in the next 4 hours to deal Critical Damage.`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Golden Thread Extract Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/golden-thread/active-buffer/:user_id
 * Retrieves user's current unactivated phrases (Charged Spells)
 */
async function handleGetActiveBuffer(request, env, corsHeaders, userId) {
    try {
        const now = new Date().toISOString();

        // Get non-expired, non-activated phrases
        const result = await env.DB.prepare(`
            SELECT id, target_phrase, phrase_type, band_value, original_context, 
                   source_content_title, captured_at, expires_at,
                   CAST((julianday(expires_at) - julianday(?)) * 24 * 60 * 60 AS INTEGER) as seconds_remaining
            FROM active_memory_buffer
            WHERE user_id = ? AND activated = 0 AND expires_at > ?
            ORDER BY captured_at DESC
            LIMIT 3
        `).bind(now, userId, now).all();

        return new Response(JSON.stringify({
            user_id: userId,
            charged_spells: result.results || [],
            count: (result.results || []).length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get Active Buffer Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * POST /api/golden-thread/verify
 * Analyzes user output (speech/writing) for buffered phrase usage
 */
async function handleGoldenThreadVerify(request, env, corsHeaders) {
    try {
        const { user_id, mission_id, mission_type, user_output, buffer_id } = await request.json();

        if (!user_id || !user_output) {
            return new Response(JSON.stringify({ error: 'user_id and user_output required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get active buffered phrases
        const bufferedPhrases = await env.DB.prepare(`
            SELECT id, target_phrase, phrase_type, band_value
            FROM active_memory_buffer
            WHERE user_id = ? AND activated = 0 AND expires_at > ?
        `).bind(user_id, new Date().toISOString()).all();

        if (!bufferedPhrases.results || bufferedPhrases.results.length === 0) {
            return new Response(JSON.stringify({
                activated: false,
                message: 'No active Charged Spells in buffer'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Use Gemini for fuzzy phrase matching (handles variations)
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{
                        text: `Analyze if the user successfully used any of the target phrases in their output.
                        
Accept semantic equivalents and grammatical variations (e.g., "played a pivotal role" matches "play a pivotal role").
Return a JSON object:
{
  "matches": [
    {"phrase": "play a pivotal role", "buffer_id": 123, "confidence": 0.95, "user_sentence": "The exact sentence where they used it"}
  ]
}`
                    }]
                },
                contents: [{
                    parts: [{
                        text: `Target Phrases:\n${bufferedPhrases.results.map(p => `- "${p.target_phrase}" (ID: ${p.id})`).join('\n')}\n\nUser Output:\n${user_output}\n\nReturn JSON with matches.`
                    }]
                }]
            })
        });

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API Error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        const text = geminiData.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
        const analysis = JSON.parse(jsonString);

        const activations = [];
        let totalDamage = 0;
        let totalXP = 0;

        // Process matches
        for (const match of analysis.matches || []) {
            if (match.confidence < 0.7) continue; // Threshold for acceptance

            const bufferId = match.buffer_id;
            const damageDealt = 50;
            const xpEarned = Math.floor(100 * match.confidence);

            // Mark as activated
            await env.DB.prepare(`
                UPDATE active_memory_buffer
                SET activated = 1, activated_at = ?
                WHERE id = ?
            `).bind(new Date().toISOString(), bufferId).run();

            // Log activation
            await env.DB.prepare(`
                INSERT INTO phrase_activation_log
                (buffer_id, user_id, activated_in_mission_id, activated_in_mission_type, user_output, pattern_match_score, damage_dealt, xp_earned)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                bufferId,
                user_id,
                mission_id || null,
                mission_type || 'speaking',
                match.user_sentence || user_output,
                match.confidence,
                damageDealt,
                xpEarned
            ).run();

            activations.push({
                phrase: match.phrase,
                damage_dealt: damageDealt,
                xp_earned: xpEarned
            });

            totalDamage += damageDealt;
            totalXP += xpEarned;
        }

        return new Response(JSON.stringify({
            activated: activations.length > 0,
            activations: activations,
            total_damage: totalDamage,
            total_xp: totalXP,
            message: activations.length > 0
                ? `💥 CRITICAL HIT! You deployed ${activations.length} Charged Spell${activations.length > 1 ? 's' : ''}!`
                : 'No Charged Spells detected in this output. Keep trying!'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Golden Thread Verify Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * POST /api/golden-thread/flashback
 * Generates "Recollection Flashback" showing original context
 */
async function handleGoldenThreadFlashback(request, env, corsHeaders) {
    try {
        const { buffer_id } = await request.json();

        const result = await env.DB.prepare(`
            SELECT target_phrase, original_context, source_content_title, 
                   band_value, phrase_type, captured_at
            FROM active_memory_buffer
            WHERE id = ?
        `).bind(buffer_id).first();

        if (!result) {
            return new Response(JSON.stringify({ error: 'Phrase not found in buffer' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            flashback: {
                phrase: result.target_phrase,
                original_sentence: result.original_context,
                source_title: result.source_content_title,
                band_value: result.band_value,
                learned_at: result.captured_at,
                mentor_message: `Remember this from "${result.source_content_title}"? This ${result.phrase_type} is worth Band ${result.band_value}. Use it to defeat the boss!`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Flashback Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// Export for integration into main API router
export {
    handleGoldenThreadExtract,
    handleGetActiveBuffer,
    handleGoldenThreadVerify,
    handleGoldenThreadFlashback
};
