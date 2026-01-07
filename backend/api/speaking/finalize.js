/**
 * POST /api/speaking/finalize
 * Finalizes the speaking mission by recording the R2 key in D1
 * and enqueuing the grading task.
 */
export async function handleSpeakingFinalize(request, env, corsHeaders) {
    try {
        const { userId, missionId, r2Key } = await request.json();

        if (!userId || !missionId || !r2Key) {
            return new Response(JSON.stringify({ error: 'userId, missionId, and r2Key are required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const submissionId = crypto.randomUUID();

        // 1. Create D1 record with pending status
        await env.DB.prepare(`
            INSERT INTO submissions (
                id,
                user_id, 
                mission_id, 
                mission_type,
                r2_key,
                status
            ) VALUES (?, ?, ?, 'speaking', ?, 'pending')
        `).bind(
            submissionId,
            userId,
            missionId,
            r2Key
        ).run();

        // 2. Enqueue grading task to Cloudflare Queue
        // In a real implementation, the consumer would fetch the audio from R2 using the key
        await env.GRADING_QUEUE.send({
            submissionId,
            userId,
            missionId,
            type: 'speaking',
            r2Key,
            timestamp: Date.now()
        });

        return new Response(JSON.stringify({
            status: 'queued',
            submissionId,
            message: "Speaking mission uploaded and queued for grading!"
        }), {
            status: 202,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Speaking finalize error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
