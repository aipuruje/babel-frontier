/**
 * Babel Frontier - Unified Worker
 * Serves both API endpoints and static frontend assets
 */

// Import the built frontend assets 
import indexHtml from '../telegram-mini-app/dist/index.html';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // CORS headers for Telegram Mini App
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // API Routes
        if (url.pathname.startsWith('/api/')) {
            return handleApiRoutes(url, request, env, corsHeaders);
        }

        // Serve static frontend
        return handleStaticAssets(url, request);
    }
};

async function handleApiRoutes(url, request, env, corsHeaders) {
    // Route: POST /api/speech-analysis
    if (url.pathname === '/api/speech-analysis' && request.method === 'POST') {
        return handleSpeechAnalysis(request, env, corsHeaders);
    }

    // Route: GET /api/leaderboard
    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
        return handleLeaderboard(request, env, corsHeaders);
    }

    // Route: GET /api/user/{userId}
    if (url.pathname.startsWith('/api/user/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[3];
        return handleGetUser(userId, env, corsHeaders);
    }

    // NEW: Enhanced Speaking Analysis (Gemini-powered with pedagogy)
    if (url.pathname === '/api/speaking/analyze-enhanced' && request.method === 'POST') {
        const { analyzeSpeakingEnhanced } = await import('./speaking_analysis_enhanced.js');
        return analyzeSpeakingEnhanced(request, env, corsHeaders);
    }

    // NEW: Enhanced Writing Analysis (Gemini-powered with pedagogy)
    if (url.pathname === '/api/writing/analyze-enhanced' && request.method === 'POST') {
        const { analyzeWritingEnhanced } = await import('./writing_analysis_enhanced.js');
        return analyzeWritingEnhanced(request, env, corsHeaders);
    }

    // RESOURCES: Query knowledge base
    if (url.pathname === '/api/resources/knowledge-base' && request.method === 'GET') {
        const { queryKnowledgeBase } = await import('./resources_handler.js');
        return queryKnowledgeBase(request, env, corsHeaders);
    }

    // RESOURCES: Unlock resource for user
    if (url.pathname === '/api/resources/unlock' && request.method === 'POST') {
        const { unlockResource } = await import('./resources_handler.js');
        return unlockResource(request, env, corsHeaders);
    }

    // RESOURCES: Get user's unlocked resources
    if (url.pathname.startsWith('/api/resources/unlocked/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[4];
        const { getUserUnlockedResources } = await import('./resources_handler.js');
        return getUserUnlockedResources(request, env, corsHeaders, userId);
    }

    // RESOURCES: Stream audio file
    if (url.pathname.startsWith('/api/audio/') && request.method === 'GET') {
        const filename = url.pathname.split('/')[3];
        const { streamAudioFile } = await import('./resources_handler.js');
        return streamAudioFile(request, env, corsHeaders, filename);
    }

    return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleStaticAssets(url, request) {
    // For now, we'll use a simple approach with Workers Sites or Assets
    // The assets will be bundled with the Worker using Wrangler

    const path = url.pathname === '/' ? '/index.html' : url.pathname;

    try {
        // Try to get asset from __STATIC_CONTENT (Workers Sites)
        // This requires proper wrangler.toml configuration with site config
        return new Response('Frontend deployment in progress', {
            headers: { 'Content-Type': 'text/plain' }
        });
    } catch (error) {
        return new Response('Not found', { status: 404 });
    }
}

async function handleSpeechAnalysis(request, env, corsHeaders) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio');
        const userId = formData.get('user_id');
        const username = formData.get('username');

        if (!audioFile) {
            return new Response(JSON.stringify({ error: 'No audio file provided' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Convert audio to buffer
        const audioBuffer = await audioFile.arrayBuffer();

        // Call OpenAI Whisper API (will migrate to Gemini 2.5 Flash)
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            },
            body: (() => {
                const fd = new FormData();
                fd.append('file', new Blob([audioBuffer]), 'audio.webm');
                fd.append('model', 'whisper-1');
                fd.append('response_format', 'verbose_json');
                return fd;
            })()
        });

        if (!whisperResponse.ok) {
            throw new Error(`Whisper API error: ${whisperResponse.statusText}`);
        }

        const transcription = await whisperResponse.json();
        const text = transcription.text || '';
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

        // Calculate damage based on word count and pauses
        let damage = 0;
        let feedback = 'Great fluency!';
        let bandScore = 'band_9.0';

        if (wordCount < 10) {
            damage = 50;
            feedback = 'Too much hesitation detected';
            bandScore = 'band_4.0';
        } else if (wordCount < 20) {
            damage = 20;
            feedback = 'Some hesitation detected';
            bandScore = 'band_6.0';
        } else {
            damage = 5;
            feedback = 'Excellent fluency!';
            bandScore = 'band_8.0';
        }

        // Save to D1 database
        if (userId && username && env.DB) {
            await saveUserProgress(env.DB, userId, username, damage, bandScore);
        }

        const response = {
            transcription: text,
            word_count: wordCount,
            damage,
            feedback,
            band_score: bandScore,
            max_pause_duration: 0,
            pause_count: 0,
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Speech analysis error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleLeaderboard(request, env, corsHeaders) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ leaderboard: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { results } = await env.DB.prepare(`
      SELECT users.username, user_brain_state.speaking_band, user_brain_state.total_xp
      FROM users
      JOIN user_brain_state ON users.user_id = user_brain_state.user_id
      ORDER BY user_brain_state.total_xp DESC
      LIMIT 10
    `).all();

        return new Response(JSON.stringify({ leaderboard: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        return new Response(JSON.stringify({ leaderboard: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleGetUser(userId, env, corsHeaders) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ error: 'Database not available' }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const user = await env.DB.prepare(`
      SELECT users.*, user_brain_state.*
      FROM users
      LEFT JOIN user_brain_state ON users.user_id = user_brain_state.user_id
      WHERE users.user_id = ?
    `).bind(userId).first();

        if (!user) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify(user), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Get user error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function saveUserProgress(db, userId, username, damage, bandScore) {
    try {
        // Upsert user
        await db.prepare(`
      INSERT INTO users (user_id, username)
      VALUES (?, ?)
      ON CONFLICT (user_id) DO UPDATE SET last_active = CURRENT_TIMESTAMP
    `).bind(userId, username).run();

        // Upsert brain state
        const bandValue = parseFloat(bandScore.replace('band_', ''));
        await db.prepare(`
      INSERT INTO user_brain_state (user_id, speaking_band, total_xp)
      VALUES (?, ?, 100)
      ON CONFLICT (user_id) DO UPDATE SET 
        speaking_band = CASE WHEN ? > speaking_band THEN ? ELSE speaking_band END,
        total_xp = total_xp + 100
    `).bind(userId, bandValue, bandValue, bandValue).run();

    } catch (error) {
        console.error('Save user progress error:', error);
    }
}
