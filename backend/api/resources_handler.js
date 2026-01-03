/**
 * IELTS Resources API Handler
 * Manages knowledge base queries, resource unlocking, and audio streaming
 */

/**
 * Query knowledge base for relevant content
 * GET /api/resources/knowledge-base?skill=grammar&difficulty=advanced&limit=5
 */
export async function queryKnowledgeBase(request, env, corsHeaders) {
    try {
        const url = new URL(request.url);
        const skill = url.searchParams.get('skill') || '';
        const difficulty = url.searchParams.get('difficulty') || '';
        const chunkType = url.searchParams.get('type') || '';
        const searchQuery = url.searchParams.get('query') || '';
        const limit = parseInt(url.searchParams.get('limit') || '5');

        if (!env.DB) {
            return new Response(JSON.stringify({ error: 'Database not available' }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Build dynamic query
        let query = 'SELECT * FROM ielts_knowledge_chunks WHERE 1=1';
        const params = [];

        if (skill) {
            query += ' AND skill_area = ?';
            params.push(skill);
        }
        if (difficulty) {
            query += ' AND difficulty = ?';
            params.push(difficulty);
        }
        if (chunkType) {
            query += ' AND chunk_type = ?';
            params.push(chunkType);
        }
        if (searchQuery) {
            query += ' AND (title LIKE ? OR content LIKE ?)';
            params.push(`%${searchQuery}%`, `%${searchQuery}%`);
        }

        query += ' ORDER BY RANDOM() LIMIT ?';
        params.push(limit);

        const stmt = env.DB.prepare(query);
        const { results } = await stmt.bind(...params).all();

        return new Response(JSON.stringify({
            success: true,
            chunks: results,
            count: results.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Knowledge base query error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Unlock a resource for a user
 * POST /api/resources/unlock
 * Body: { userId, resourceId, resourceType }
 */
export async function unlockResource(request, env, corsHeaders) {
    try {
        const { userId, resourceId, resourceType } = await request.json();

        if (!userId || !resourceId || !resourceType) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!env.DB) {
            return new Response(JSON.stringify({ error: 'Database not available' }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Insert or ignore (idempotent)
        await env.DB.prepare(`
            INSERT INTO user_unlocked_resources (user_id, resource_type, resource_id)
            VALUES (?, ?, ?)
            ON CONFLICT (user_id, resource_id) DO NOTHING
        `).bind(userId, resourceType, resourceId).run();

        // Get the unlocked resource details
        const resource = await env.DB.prepare(`
            SELECT * FROM ielts_knowledge_chunks WHERE id = ?
        `).bind(resourceId).first();

        return new Response(JSON.stringify({
            success: true,
            message: 'Resource unlocked',
            resource: resource
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Unlock resource error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Get user's unlocked resources
 * GET /api/resources/unlocked/:userId
 */
export async function getUserUnlockedResources(request, env, corsHeaders, userId) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ resources: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { results } = await env.DB.prepare(`
            SELECT 
                uur.resource_type,
                uur.unlocked_at,
                ikc.*
            FROM user_unlocked_resources uur
            JOIN ielts_knowledge_chunks ikc ON uur.resource_id = ikc.id
            WHERE uur.user_id = ?
            ORDER BY uur.unlocked_at DESC
        `).bind(userId).all();

        return new Response(JSON.stringify({
            success: true,
            resources: results,
            count: results.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get unlocked resources error:', error);
        return new Response(JSON.stringify({ resources: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Stream audio file
 * GET /api/audio/:filename
 * TODO: Implement R2 streaming once audio files are uploaded
 */
export async function streamAudioFile(request, env, corsHeaders, filename) {
    try {
        // For now, return 501 Not Implemented
        // Will be implemented once audio files are uploaded to R2
        return new Response(JSON.stringify({
            error: 'Audio streaming not yet implemented',
            message: 'Upload audio files to Cloudflare R2 first'
        }), {
            status: 501,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

        // Future implementation:
        // const audioObject = await env.R2_BUCKET.get(`audio/${filename}`);
        // if (!audioObject) {
        //     return new Response('Audio file not found', { status: 404 });
        // }
        // return new Response(audioObject.body, {
        //     headers: { 'Content-Type': 'audio/mpeg' }
        // });

    } catch (error) {
        console.error('Audio streaming error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * RAG Helper: Query knowledge base and format for AI prompt
 */
export async function queryForRAG(db, userText, skill, limit = 3) {
    try {
        // Simple keyword extraction from user text
        const keywords = userText
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 4) // Only significant words
            .slice(0, 10);

        // Query for relevant chunks
        const chunks = [];
        for (const keyword of keywords) {
            const { results } = await db.prepare(`
                SELECT * FROM ielts_knowledge_chunks
                WHERE skill_area = ? 
                AND (title LIKE ? OR content LIKE ?)
                LIMIT 2
            `).bind(skill, `%${keyword}%`, `%${keyword}%`).all();

            chunks.push(...results);
            if (chunks.length >= limit) break;
        }

        // Deduplicate by ID
        const uniqueChunks = [...new Map(chunks.map(c => [c.id, c])).values()];

        return uniqueChunks.slice(0, limit);

    } catch (error) {
        console.error('RAG query error:', error);
        return [];
    }
}
