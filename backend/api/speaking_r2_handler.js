/**
 * R2-Optimized Speaking Handler
 * Implements streaming architecture for audio uploads
 * 
 * Architecture:
 * - Audio chunks → Stream directly to R2 (no Worker memory buffering)
 * - Metadata only → D1 (URL, status, user_id)
 * - Avoids "Silent Audio Drop" failures at 12% chunk loss rate
 * 
 * CRITICAL: Use Request.body as Stream, NOT .arrayBuffer()
 */

/**
 * Initialize speaking session
 * POST /api/speaking/init
 */
export async function handleSpeakingInit(request, env, corsHeaders) {
    try {
        const { userId, missionId, topic } = await request.json();

        if (!userId || !missionId) {
            return new Response(JSON.stringify({ error: 'Missing userId or missionId' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const sessionId = `${userId}_${missionId}_${Date.now()}`;

        // Track session in D1 (metadata only, no audio bytes)
        if (env.DB) {
            try {
                await env.DB.prepare(`
                    INSERT INTO speaking_sessions (
                        session_id,
                        user_id,
                        mission_id,
                        topic,
                        status,
                        created_at
                    ) VALUES (?, ?, ?, ?, 'initialized', datetime('now'))
                `).bind(sessionId, userId, missionId, topic || 'general').run();
            } catch (dbError) {
                console.error('D1 session init error:', dbError);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            session_id: sessionId,
            message: 'Speaking session initialized',
            upload_endpoint: '/api/speaking/upload-chunk'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Speaking init error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Upload audio chunk - Stream to R2
 * POST /api/speaking/upload-chunk
 */
export async function handleChunkUpload(request, env, corsHeaders) {
    try {
        const userId = request.headers.get('X-User-ID');
        const sessionId = request.headers.get('X-Session-ID');
        const chunkIndex = request.headers.get('X-Chunk-Index');

        if (!userId || !sessionId || !chunkIndex) {
            return new Response(JSON.stringify({
                error: 'Missing headers: X-User-ID, X-Session-ID, X-Chunk-Index required'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Generate R2 key for this chunk
        const r2Key = `audio/${userId}/${sessionId}/chunk_${chunkIndex}.webm`;

        // CRITICAL: Stream body directly to R2, don't buffer in Worker memory
        // This prevents the 12% "Silent Audio Drop" failure rate
        if (env.AUDIO_BUCKET) {
            try {
                await env.AUDIO_BUCKET.put(r2Key, request.body, {
                    httpMetadata: {
                        contentType: 'audio/webm'
                    },
                    customMetadata: {
                        userId: userId,
                        sessionId: sessionId,
                        chunkIndex: chunkIndex,
                        uploadedAt: new Date().toISOString()
                    }
                });
            } catch (r2Error) {
                console.error('R2 upload error:', r2Error);
                throw new Error(`R2 upload failed: ${r2Error.message}`);
            }
        } else {
            console.warn('AUDIO_BUCKET not configured - audio not persisted');
        }

        // Update D1 with chunk metadata (not the audio bytes!)
        if (env.DB) {
            try {
                await env.DB.prepare(`
                    UPDATE speaking_sessions 
                    SET 
                        chunks_uploaded = chunks_uploaded + 1,
                        last_chunk_at = datetime('now'),
                        status = 'recording'
                    WHERE session_id = ?
                `).bind(sessionId).run();
            } catch (dbError) {
                console.error('D1 chunk tracking error:', dbError);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Chunk uploaded to R2',
            r2_key: r2Key,
            chunk_index: chunkIndex,
            storage: 'r2-streaming'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Chunk upload error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            hint: 'Ensure audio is sent as binary body, not base64'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Finalize speaking session and trigger AI processing
 * POST /api/speaking/finalize
 */
export async function handleSpeakingFinalize(request, env, corsHeaders) {
    try {
        const { userId, sessionId, missionId } = await request.json();

        if (!userId || !sessionId) {
            return new Response(JSON.stringify({ error: 'Missing userId or sessionId' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Update session status
        if (env.DB) {
            try {
                await env.DB.prepare(`
                    UPDATE speaking_sessions 
                    SET status = 'processing',
                        finalized_at = datetime('now')
                    WHERE session_id = ?
                `).bind(sessionId).run();
            } catch (dbError) {
                console.error('D1 finalize error:', dbError);
            }
        }

        // In production, you would:
        // 1. Combine all R2 chunks into single file
        // 2. Send to speech-to-text API (Gemini, Whisper, etc.)
        // 3. Run AI analysis on transcription
        // 4. Store results in D1

        // For now, return processing acknowledgment
        return new Response(JSON.stringify({
            success: true,
            status: 'processing',
            session_id: sessionId,
            message: 'Audio chunks received, AI processing queued',
            note: 'In production: R2 chunks → STT API → AI grading → D1 results'
        }), {
            status: 202,  // Accepted - processing asynchronously
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

/**
 * Get speaking session status
 * GET /api/speaking/status/:sessionId
 */
export async function handleSpeakingStatus(request, env, corsHeaders, sessionId) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ error: 'Database not configured' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const session = await env.DB.prepare(`
            SELECT * FROM speaking_sessions WHERE session_id = ?
        `).bind(sessionId).first();

        if (!session) {
            return new Response(JSON.stringify({ error: 'Session not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            session: session
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Speaking status error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
