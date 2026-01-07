/**
 * KV-Optimized Writing Handler
 * Implements Write-Aside pattern for high-throughput auto-saves
 * 
 * Architecture:
 * - Auto-saves → Cloudflare KV (10-50ms latency, unlimited concurrency)
 * - Final submissions → D1 (permanent record, ACID compliance)
 * 
 * This eliminates the "D1 Glass Ceiling" at 350+ concurrent users
 */

import { analyzeWritingEnhanced } from './writing_analysis_enhanced.js';

/**
 * Auto-save endpoint - High-frequency writes to KV
 * PUT /api/writing/save
 */
export async function handleAutoSave(request, env, corsHeaders) {
    try {
        const { userId, missionId, content, timestamp } = await request.json();

        if (!userId || !missionId || !content) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Create unique key for this draft
        const draftKey = `draft:${userId}:${missionId}`;

        // Write to KV with TTL (auto-cleanup after 24 hours)
        await env.DRAFTS_KV.put(draftKey, JSON.stringify({
            content,
            timestamp: timestamp || new Date().toISOString(),
            wordCount: content.split(/\s+/).length,
            lastSaved: Date.now()
        }), {
            expirationTtl: 86400  // 24 hours
        });

        return new Response(JSON.stringify({
            success: true,
            message: 'Draft saved to KV',
            storage: 'kv',
            latency_note: 'KV writes are 10-50ms vs D1 200-2000ms'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Auto-save error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            recovery: 'Client should retry auto-save'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Real-time analysis endpoint (optional - for live feedback)
 * POST /api/writing/analyze-realtime
 */
export async function handleRealtimeAnalysis(request, env, corsHeaders) {
    try {
        const { text, user_id } = await request.json();

        if (!text) {
            return new Response(JSON.stringify({ error: 'No text provided' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const wordCount = text.split(/\s+/).length;

        // For real-time analysis, we provide quick feedback without full AI grading
        // This can be enhanced with AI if needed, but kept lightweight for speed
        return new Response(JSON.stringify({
            success: true,
            word_count: wordCount,
            status: wordCount < 250 ? 'incomplete' : 'adequate',
            real_time: true,
            note: 'Full AI analysis on submission'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Real-time analysis error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Final submission endpoint - Pull from KV, grade with AI, persist to D1
 * POST /api/writing/submit
 */
export async function handleSubmit(request, env, corsHeaders) {
    try {
        const { userId, missionId, essay, prompt, word_target, user_id, username } = await request.json();

        // Determine the essay content source
        let finalEssay = essay;
        let source = 'direct';

        // If no essay provided, try to retrieve from KV
        if (!finalEssay && userId && missionId) {
            const draftKey = `draft:${userId}:${missionId}`;
            const draftData = await env.DRAFTS_KV.get(draftKey);

            if (!draftData) {
                return new Response(JSON.stringify({
                    error: 'Draft not found',
                    hint: 'Essay must be provided or saved draft must exist'
                }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const draft = JSON.parse(draftData);
            finalEssay = draft.content;
            source = 'kv';
        }

        if (!finalEssay) {
            return new Response(JSON.stringify({ error: 'No essay content to grade' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Trigger AI Grading using existing enhanced analysis
        const gradingRequest = new Request(request.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: finalEssay,
                promptType: 'task2',
                userId: user_id || userId
            })
        });

        const gradingResponse = await analyzeWritingEnhanced(gradingRequest, env, corsHeaders);
        const gradingData = await gradingResponse.json();

        if (!gradingData.success) {
            throw new Error('AI grading failed');
        }

        const analysis = gradingData.analysis;

        // Persist to D1 (single write, not 50+ auto-saves)
        if (env.DB) {
            try {
                await env.DB.prepare(`
                    INSERT INTO submissions (
                        userId, 
                        username, 
                        essay, 
                        prompt,
                        band_score, 
                        task_achievement,
                        coherence_cohesion,
                        lexical_resource,
                        grammatical_range_accuracy,
                        feedback,
                        word_count,
                        submitted_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `).bind(
                    user_id || userId,
                    username || 'anonymous',
                    finalEssay,
                    prompt || 'N/A',
                    analysis.overall_band || 0,
                    analysis.task_achievement || 0,
                    analysis.coherence_cohesion || 0,
                    analysis.lexical_resource || 0,
                    analysis.grammatical_range_accuracy || 0,
                    JSON.stringify(analysis.feedback || {}),
                    gradingData.word_count || 0
                ).run();
            } catch (dbError) {
                console.error('D1 persistence error:', dbError);
                // Don't fail the response - grading succeeded
            }
        }

        // Cleanup KV draft
        if (userId && missionId) {
            const draftKey = `draft:${userId}:${missionId}`;
            await env.DRAFTS_KV.delete(draftKey);
        }

        return new Response(JSON.stringify({
            success: true,
            band_score: analysis.overall_band,
            task_achievement: analysis.task_achievement,
            coherence: analysis.coherence_cohesion,
            vocabulary: analysis.lexical_resource,
            grammar: analysis.grammatical_range_accuracy,
            feedback: analysis.feedback,
            word_count: gradingData.word_count,
            source: source,
            storage_pattern: 'KV auto-saves → D1 final record'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Submit error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
