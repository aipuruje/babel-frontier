/**
 * Writing Queue Handler - Producer
 * Implements the "Instant Response" pattern for essay submissions
 * 
 * Flow:
 * 1. Accept POST /api/writing/submit
 * 2. Create D1 record with status='PENDING'
 * 3. Enqueue grading task to GRADING_QUEUE
 * 4. Return 202 Accepted with submissionId
 * 
 * The consumer worker processes the queue async and updates D1 to 'COMPLETED'
 */

/**
 * Handle async essay submission (Producer)
 * POST /api/writing/submit
 */
export async function handleSubmitAsync(request, env, corsHeaders) {
    try {
        const { userId, missionId, essay, prompt, word_target, user_id, username } = await request.json();

        // Determine the essay content source
        let finalEssay = essay;
        let source = 'direct';

        // If no essay provided, try to retrieve from KV (auto-saved draft)
        if (!finalEssay && userId && missionId && env.DRAFTS_KV) {
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

        const effectiveUserId = user_id || userId;
        const effectiveUsername = username || 'anonymous';

        // Use a unique ID for the submission (text pk)
        const submissionId = crypto.randomUUID();

        // 1. Store essay content in KV for the grader (Hardened architecture)
        const kvKey = `assay_content:${submissionId}`;
        if (env.DRAFTS_KV) {
            await env.DRAFTS_KV.put(kvKey, finalEssay);
        }

        // 2. Create D1 record with pending status
        await env.DB.prepare(`
            INSERT INTO submissions (
                id,
                user_id, 
                mission_id, 
                mission_type,
                kv_draft_key,
                status
            ) VALUES (?, ?, ?, 'writing', ?, 'pending')
        `).bind(
            submissionId,
            effectiveUserId,
            missionId || 'general',
            kvKey
        ).run();

        // 3. Enqueue grading task to Cloudflare Queue
        await env.GRADING_QUEUE.send({
            submissionId,
            userId: effectiveUserId,
            essayContent: finalEssay, // Passing content directly for the grader
            prompt: prompt || null,
            source,
            isRemediation: request.headers.get('x-mission-type') === 'REMEDIATION',
            remediationType: request.headers.get('x-remediation-type'),
            timestamp: Date.now()
        });

        // 4. Return instant success (202 Accepted)
        return new Response(JSON.stringify({
            status: 'queued',
            submissionId,
            message: "Your essay is being graded. Check back in a few moments!",
            polling_endpoint: `/api/submissions/${submissionId}`,
            estimated_time_seconds: 30
        }), {
            status: 202,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });


    } catch (error) {
        console.error('Async submit error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Get submission status (Polling endpoint)
 * GET /api/submissions/:submissionId
 */
export async function handleGetSubmissionStatus(submissionId, userId, env, corsHeaders) {
    try {
        if (!submissionId) {
            return new Response(JSON.stringify({ error: 'submissionId required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Query D1 for submission status (Master spec field names)
        const result = await env.DB.prepare(`
            SELECT 
                id,
                user_id,
                status,
                overall_band,
                criteria_scores,
                feedback_json,
                created_at,
                completed_at
            FROM submissions 
            WHERE id = ?
        `).bind(submissionId).first();


        if (!result) {
            return new Response(JSON.stringify({
                error: 'Submission not found',
                submissionId
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Optional: Verify userId matches (security check)
        // Uncomment if you want to enforce user ownership
        // if (userId && result.userId !== userId) {
        //     return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        //         status: 403,
        //         headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        //     });
        // }

        // Return response based on status
        if (result.status === 'pending' || result.status === 'processing') {
            return new Response(JSON.stringify({
                status: result.status,
                submissionId: result.id,
                message: 'Your essay is being graded. Please wait...',
                created_at: result.created_at,
                estimated_completion: '10-30 seconds'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (result.status === 'failed') {
            return new Response(JSON.stringify({
                status: 'failed',
                submissionId: result.id,
                message: 'Grading encountered an error. Our team has been notified.'
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Status: completed
        const criteriaScores = result.criteria_scores ? JSON.parse(result.criteria_scores) : {};
        const feedback = result.feedback_json ? JSON.parse(result.feedback_json) : {};

        // Fetch user momentum
        const user = await env.DB.prepare(`SELECT momentum_score FROM users WHERE user_id = ?`).bind(result.user_id).first();

        return new Response(JSON.stringify({
            status: 'completed',
            submissionId: result.id,
            overall_band: result.overall_band,
            criteria_scores: criteriaScores,
            feedback: feedback,
            momentum: user ? user.momentum_score : null,
            created_at: result.created_at,
            completed_at: result.completed_at
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });


    } catch (error) {
        console.error('Get submission status error:', error);
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
