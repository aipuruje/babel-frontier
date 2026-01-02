/**
 * Babel Frontier - Unified Worker
 * Serves both API endpoints and static frontend assets
 */

import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);

// Pedagogy Manifest (IELTS Band System)
const PEDAGOGY_MANIFEST = {
    "band_progression": {
        "band_9.0": { "label": "Expert User", "damage_range": [0, 5], "speaking_criteria": { "pause_tolerance": "< 0.5s", "hesitation_penalty": 1 }, "icon": "👑", "feedback": "Outstanding fluency! Near-native command." },
        "band_8.5": { "label": "Very Good User+", "damage_range": [6, 10], "speaking_criteria": { "pause_tolerance": "< 1.0s", "hesitation_penalty": 2 }, "icon": "⭐", "feedback": "Excellent! Very fluent with rare hesitations." },
        "band_8.0": { "label": "Very Good User", "damage_range": [11, 20], "speaking_criteria": { "pause_tolerance": "< 1.5s", "hesitation_penalty": 3 }, "icon": "🌟", "feedback": "Great fluency! Handles complex speech well." },
        "band_7.5": { "label": "Good User+", "damage_range": [21, 30], "speaking_criteria": { "pause_tolerance": "< 2.0s", "hesitation_penalty": 4 }, "icon": "✨", "feedback": "Good command with occasional inaccuracies." },
        "band_7.0": { "label": "Good User", "damage_range": [31, 40], "speaking_criteria": { "pause_tolerance": "< 2.5s", "hesitation_penalty": 5 }, "icon": "💫", "feedback": "Competent but with some hesitation." },
        "band_6.5": { "label": "Competent User+", "damage_range": [41, 50], "speaking_criteria": { "pause_tolerance": "< 3.0s", "hesitation_penalty": 6 }, "icon": "🔥", "feedback": "Generally effective with hesitation." },
        "band_6.0": { "label": "Competent User", "damage_range": [51, 60], "speaking_criteria": { "pause_tolerance": "< 3.5s", "hesitation_penalty": 7 }, "icon": "⚡", "feedback": "Effective despite frequent pauses." },
        "band_5.5": { "label": "Modest User+", "damage_range": [61, 70], "speaking_criteria": { "pause_tolerance": "< 4.0s", "hesitation_penalty": 8 }, "icon": "⚠️", "feedback": "Partial command with repetition." },
        "band_5.0": { "label": "Modest User", "damage_range": [71, 80], "speaking_criteria": { "pause_tolerance": "< 5.0s", "hesitation_penalty": 9 }, "icon": "🔻", "feedback": "Cannot respond without noticeable pauses." },
        "band_4.5": { "label": "Limited User+", "damage_range": [81, 90], "speaking_criteria": { "pause_tolerance": "< 6.0s", "hesitation_penalty": 10 }, "icon": "❌", "feedback": "Frequent breakdowns and long pauses." },
        "band_4.0": { "label": "Limited User", "damage_range": [91, 100], "speaking_criteria": { "pause_tolerance": "< 8.0s", "hesitation_penalty": 12 }, "icon": "💀", "feedback": "Very limited ability, pauses before most words." },
        "band_3.5": { "label": "Extremely Limited", "damage_range": [101, 999], "speaking_criteria": { "pause_tolerance": "> 8.0s", "hesitation_penalty": 15 }, "icon": "☠️", "feedback": "Extremely limited, frequent communication breakdown." }
    }
};

// Helper: Get pedagogy manifest
async function getPedagogyManifest() {
    return PEDAGOGY_MANIFEST;
}

// Helper: Analyze speech using pedagogy system
function analyzeSpeechWithPedagogy(text, wordCount, manifest) {
    // Calculate damage based on fluency metrics
    let damage = 0;

    // Word count penalty (low word count = high hesitation)
    if (wordCount < 5) {
        damage += 80;
    } else if (wordCount < 10) {
        damage += 60;
    } else if (wordCount < 15) {
        damage += 40;
    } else if (wordCount < 20) {
        damage += 20;
    } else if (wordCount < 30) {
        damage += 10;
    } else {
        damage += 3;
    }

    // Additional penalties for common errors (simple heuristics)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;

    // Penalize very short sentences (sign of hesitation)
    if (avgWordsPerSentence < 5 && wordCount > 10) {
        damage += 10;
    }

    // Find matching band based on damage
    let bandScore = 'band_3.5';
    let bandData = manifest.band_progression['band_3.5'];

    for (const [bandKey, data] of Object.entries(manifest.band_progression)) {
        const [min, max] = data.damage_range;
        if (damage >= min && damage <= max) {
            bandScore = bandKey;
            bandData = data;
            break;
        }
    }

    return {
        damage,
        bandScore,
        feedback: bandData.feedback,
        bandLabel: bandData.label,
        icon: bandData.icon
    };
}

export default {
    async fetch(request, env, ctx) {
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

        // Handle webhook BEFORE checking for /api/* prefix
        if (url.pathname === '/webhook' && request.method === 'POST') {
            return handleTelegramWebhook(request, env, corsHeaders);
        }

        // API Routes
        if (url.pathname.startsWith('/api/')) {
            return handleApiRoutes(url, request, env, corsHeaders);
        }

        // Serve static frontend assets using Workers Sites
        try {
            return await getAssetFromKV(
                {
                    request,
                    waitUntil: ctx.waitUntil.bind(ctx),
                },
                {
                    ASSET_NAMESPACE: env.__STATIC_CONTENT,
                    ASSET_MANIFEST: assetManifest,
                }
            );
        } catch (e) {
            console.error('Asset serving error:', e.message);
            // If the asset is not found, serve index.html for SPA routing
            if (e.status === 404) {
                try {
                    return await getAssetFromKV(
                        { request: new Request(`${url.origin}/index.html`, request), waitUntil: ctx.waitUntil.bind(ctx) },
                        { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest }
                    );
                } catch (e2) {
                    console.error('Index.html fallback error:', e2.message);
                }
            }
            return new Response(`Error loading page: ${e.message}`, { status: 500 });
        }
    }
};

async function handleApiRoutes(url, request, env, corsHeaders) {
    // Route: POST /webhook (Telegram bot)
    if (url.pathname === '/webhook' && request.method === 'POST') {
        return handleTelegramWebhook(request, env, corsHeaders);
    }

    // Route: POST /api/speech-analysis
    if (url.pathname === '/api/speech-analysis' && request.method === 'POST') {
        return handleSpeechAnalysis(request, env, corsHeaders);
    }

    if (url.pathname === '/api/analyze-writing' && request.method === 'POST') {
        return handleWritingAnalysis(request, env, corsHeaders);
    }

    // Route: GET /api/leaderboard
    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
        return handleLeaderboard(env, corsHeaders);
    }

    // Route: GET /api/user/{userId}
    if (url.pathname.startsWith('/api/user/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[3];
        return handleGetUser(userId, env, corsHeaders);
    }

    // ========== WEEK 2: MONETIZATION ROUTES ==========

    // Route: GET /api/marketplace/products
    if (url.pathname === '/api/marketplace/products' && request.method === 'GET') {
        return handleMarketplaceProducts(corsHeaders);
    }

    // Route: POST /api/marketplace/initiate
    if (url.pathname === '/api/marketplace/initiate' && request.method === 'POST') {
        return handlePaymentInitiate(request, env, corsHeaders);
    }

    // Route: GET /api/inventory/:userId
    if (url.pathname.startsWith('/api/inventory/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[3];
        return handleGetInventory(userId, env, corsHeaders);
    }

    // Route: POST /api/payment/webhook/click
    if (url.pathname === '/api/payment/webhook/click' && request.method === 'POST') {
        return handleClickWebhook(request, env, corsHeaders);
    }

    // Route: POST /api/payment/webhook/payme
    if (url.pathname === '/api/payment/webhook/payme' && request.method === 'POST') {
        return handlePaymeWebhook(request, env, corsHeaders);
    }

    // Route: POST /api/payment/webhook/mock (for testing)
    if (url.pathname === '/api/payment/webhook/mock' && request.method === 'POST') {
        return handleMockWebhook(request, env, corsHeaders);
    }

    // ========== WEEK 2: WRITING FOUNDRY ROUTES ==========

    // Route: POST /api/writing/analyze-realtime
    if (url.pathname === '/api/writing/analyze-realtime' && request.method === 'POST') {
        return handleWritingAnalyzeRealtime(request, env, corsHeaders);
    }

    // Route: POST /api/writing/submit
    if (url.pathname === '/api/writing/submit' && request.method === 'POST') {
        return handleWritingSubmit(request, env, corsHeaders);
    }

    // Route: GET /api/writing/history/:userId
    if (url.pathname.startsWith('/api/writing/history/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[4];
        return handleWritingHistory(userId, env, corsHeaders);
    }

    // ========== WEEK 2 DAY 5: SOCIAL WARFARE ROUTES ==========

    // Route: GET /api/regions/map
    if (url.pathname === '/api/regions/map' && request.method === 'GET') {
        return handleRegionalMap(request, env, corsHeaders);
    }

    // Route: POST /api/user/location
    if (url.pathname === '/api/user/location' && request.method === 'POST') {
        return handleSetUserLocation(request, env, corsHeaders);
    }

    // Route: POST /api/guilds/create
    if (url.pathname === '/api/guilds/create' && request.method === 'POST') {
        return handleCreateGuild(request, env, corsHeaders);
    }

    // Route: GET /api/guilds/:guildId
    if (url.pathname.startsWith('/api/guilds/') && request.method === 'GET' && !url.pathname.includes('/join')) {
        const guildId = url.pathname.split('/')[3];
        return handleGetGuild(guildId, env, corsHeaders);
    }

    // Route: POST /api/guilds/:guildId/join
    if (url.pathname.match(/\/api\/guilds\/\d+\/join/) && request.method === 'POST') {
        const guildId = url.pathname.split('/')[3];
        return handleJoinGuild(guildId, request, env, corsHeaders);
    }

    // Route: GET /api/leaderboard/regional
    if (url.pathname === '/api/leaderboard/regional' && request.method === 'GET') {
        return handleRegionalLeaderboard(env, corsHeaders);
    }

    // ========== WEEK 2 DAY 6: INFINITE PEDAGOGY ROUTES ==========

    // Route: POST /api/content/generate
    if (url.pathname === '/api/content/generate' && request.method === 'POST') {
        return handleGenerateContent(request, env, corsHeaders);
    }

    // Route: GET /api/content/mission/:skillDomain
    if (url.pathname.startsWith('/api/content/mission/') && request.method === 'GET') {
        const skillDomain = url.pathname.split('/')[4];
        return handleGetMission(skillDomain, request, env, corsHeaders);
    }

    // Route: GET /api/events/upcoming
    if (url.pathname === '/api/events/upcoming' && request.method === 'GET') {
        return handleUpcomingEvents(env, corsHeaders);
    }

    // Route: GET /api/events/:eventId
    if (url.pathname.startsWith('/api/events/') && !url.pathname.includes('/contribute') && !url.pathname.includes('/upcoming') && request.method === 'GET') {
        const eventId = url.pathname.split('/')[3];
        return handleGetEvent(eventId, request, env, corsHeaders);
    }

    // Route: POST /api/events/:eventId/contribute
    if (url.pathname.match(/\/api\/events\/\d+\/contribute/) && request.method === 'POST') {
        const eventId = url.pathname.split('/')[3];
        return handleEventContribute(eventId, request, env, corsHeaders);
    }

    // Route: POST /api/events/create (admin/teacher only)
    if (url.pathname === '/api/events/create' && request.method === 'POST') {
        return handleCreateEvent(request, env, corsHeaders);
    }


    // Route: GET /api/notifications/:userId
    if (url.pathname.startsWith('/api/notifications/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[3];
        return handleGetNotifications(userId, env, corsHeaders);
    }

    // ========== WEEK 3 DAY 15: CONFIDENCE ENGINE ROUTES ==========

    // Route: POST /api/confidence/analyze-stream
    if (url.pathname === '/api/confidence/analyze-stream' && request.method === 'POST') {
        return handleConfidenceAnalyzeStream(request, env, corsHeaders);
    }

    // Route: GET /api/confidence/history/:userId
    if (url.pathname.startsWith('/api/confidence/history/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[4];
        return handleConfidenceHistory(userId, env, corsHeaders);
    }

    // Route: GET /api/confidence/filler-spell
    if (url.pathname === '/api/confidence/filler-spell' && request.method === 'GET') {
        return handleGetFillerSpell(request, env, corsHeaders);
    }

    // ========== WEEK 3 DAY 16: AR SCANNER ROUTES ==========

    // Route: POST /api/vision/scan-object
    if (url.pathname === '/api/vision/scan-object' && request.method === 'POST') {
        return handleVisionScanObject(request, env, corsHeaders);
    }

    // Route: GET /api/vision/passages/:userId
    if (url.pathname.startsWith('/api/vision/passages/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[4];
        return handleVisionPassages(userId, env, corsHeaders);
    }

    // Route: POST /api/vision/quiz-submit
    if (url.pathname === '/api/vision/quiz-submit' && request.method === 'POST') {
        return handleVisionQuizSubmit(request, env, corsHeaders);
    }

    // ========== WEEK 3 DAY 17: B2B UNIVERSITY BRIDGE ROUTES ==========

    // Route: POST /api/b2b/partners/register
    if (url.pathname === '/api/b2b/partners/register' && request.method === 'POST') {
        return handlePartnerRegister(request, env, corsHeaders);
    }

    // Route: GET /api/b2b/partners/:partnerId/leads
    if (url.pathname.match(/\/api\/b2b\/partners\/\d+\/leads/) && request.method === 'GET') {
        const partnerId = url.pathname.split('/')[4];
        return handlePartnerLeads(partnerId, request, env, corsHeaders);
    }

    // Route: POST /api/b2b/consultation/book
    if (url.pathname === '/api/b2b/consultation/book' && request.method === 'POST') {
        return handleConsultationBook(request, env, corsHeaders);
    }

    // Route: GET /api/b2b/analytics/:partnerId
    if (url.pathname.startsWith('/api/b2b/analytics/') && request.method === 'GET') {
        const partnerId = url.pathname.split('/')[4];
        return handlePartnerAnalytics(partnerId, env, corsHeaders);
    }

    // Route: POST /api/b2b/lead/trigger (auto-trigger when user hits Band 7.5+)
    if (url.pathname === '/api/b2b/lead/trigger' && request.method === 'POST') {
        return handleLeadTrigger(request, env, corsHeaders);
    }

    // ========== DAYS 18-20: SOVEREIGN PHASE ROUTES ==========

    // Day 18: Philosopher's Duel
    if (url.pathname === '/api/debate/start' && request.method === 'POST') {
        return handleDebateStart(request, env, corsHeaders);
    }

    if (url.pathname === '/api/debate/submit-argument' && request.method === 'POST') {
        return handleDebateSubmitArgument(request, env, corsHeaders);
    }

    if (url.pathname === '/api/debate/counterargument' && request.method === 'POST') {
        return handleDebateCounterargument(request, env, corsHeaders);
    }

    if (url.pathname.startsWith('/api/debate/history/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[4];
        return handleDebateHistory(userId, env, corsHeaders);
    }

    // Day 19: The Great Game
    if (url.pathname === '/api/national/join-team' && request.method === 'POST') {
        return handleNationalJoinTeam(request, env, corsHeaders);
    }

    if (url.pathname === '/api/national/live-scores' && request.method === 'GET') {
        return handleNationalLiveScores(env, corsHeaders);
    }

    if (url.pathname === '/api/national/contribute-score' && request.method === 'POST') {
        return handleNationalContributeScore(request, env, corsHeaders);
    }

    if (url.pathname === '/api/national/territory-map' && request.method === 'GET') {
        return handleNationalTerritoryMap(env, corsHeaders);
    }

    if (url.pathname === '/api/national/schedule-battle' && request.method === 'POST') {
        return handleNationalScheduleBattle(request, env, corsHeaders);
    }

    // Day 20: Oracle's Seal
    if (url.pathname.startsWith('/api/oracle/predict/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[4];
        return handleOraclePredict(userId, env, corsHeaders);
    }

    if (url.pathname.startsWith('/api/oracle/weaknesses/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[4];
        return handleOracleWeaknesses(userId, env, corsHeaders);
    }

    if (url.pathname === '/api/oracle/vocabulary-rec' && request.method === 'GET') {
        const userId = url.searchParams.get('user_id');
        return handleOracleVocabularyRec(userId, env, corsHeaders);
    }

    if (url.pathname === '/api/oracle/book-exam' && request.method === 'POST') {
        return handleOracleBookExam(request, env, corsHeaders);
    }

    if (url.pathname.startsWith('/api/oracle/seal/') && request.method === 'GET') {
        const userId = url.pathname.split('/')[4];
        return handleOracleSeal(userId, env, corsHeaders);
    }

    // ========== WEEK 4: TITAN PHASE ROUTES ==========

    // Day 22: Spatial Raids
    if (url.pathname === '/api/vr/start-session' && request.method === 'POST') {
        return handleVRStartSession(request, env, corsHeaders);
    }

    if (url.pathname === '/api/vr/gyroscope-data' && request.method === 'POST') {
        return handleVRGyroscopeData(request, env, corsHeaders);
    }

    if (url.pathname.startsWith('/api/vr/discover-artifact/') && request.method === 'POST') {
        const artifactId = url.pathname.split('/')[4];
        return handleVRDiscoverArtifact(artifactId, request, env, corsHeaders);
    }

    // Day 23: Neural Mirroring
    if (url.pathname === '/api/neural/analyze-waveform' && request.method === 'POST') {
        return handleNeuralAnalyzeWaveform(request, env, corsHeaders);
    }

    if (url.pathname === '/api/neural/detect-nuance' && request.method === 'POST') {
        return handleNeuralDetectNuance(request, env, corsHeaders);
    }

    // Day 24: National Tournament
    if (url.pathname === '/api/tournament/create' && request.method === 'POST') {
        return handleTournamentCreate(request, env, corsHeaders);
    }

    if (url.pathname === '/api/tournament/register' && request.method === 'POST') {
        return handleTournamentRegister(request, env, corsHeaders);
    }

    if (url.pathname.startsWith('/api/tournament/') && url.pathname.endsWith('/brackets') && request.method === 'GET') {
        const tournamentId = url.pathname.split('/')[3];
        return handleTournamentBrackets(tournamentId, env, corsHeaders);
    }

    if (url.pathname === '/api/tournament/submit-match' && request.method === 'POST') {
        return handleTournamentSubmitMatch(request, env, corsHeaders);
    }

    // Day 25: Series A Data Room
    if (url.pathname === '/api/metrics/daily' && request.method === 'GET') {
        return handleMetricsDaily(env, corsHeaders);
    }

    if (url.pathname === '/api/metrics/ltv' && request.method === 'GET') {
        return handleMetricsLTV(env, corsHeaders);
    }

    if (url.pathname === '/api/metrics/market-projections' && request.method === 'GET') {
        return handleMetricsMarketProjections(env, corsHeaders);
    }

    // Day 26: Multi-Region
    if (url.pathname === '/api/region/config' && request.method === 'GET') {
        const countryCode = url.searchParams.get('country');
        return handleRegionConfig(countryCode, env, corsHeaders);
    }

    if (url.pathname === '/api/region/localized-content' && request.method === 'GET') {
        const countryCode = url.searchParams.get('country');
        return handleRegionLocalizedContent(countryCode, env, corsHeaders);
    }

    // Day 27: AI Governance
    if (url.pathname === '/api/governance/health' && request.method === 'GET') {
        return handleGovernanceHealth(env, corsHeaders);
    }

    if (url.pathname === '/api/governance/alerts' && request.method === 'GET') {
        return handleGovernanceAlerts(env, corsHeaders);
    }

    // Day 28: Coronation
    if (url.pathname === '/api/finale/founder-status' && request.method === 'GET') {
        const userId = url.searchParams.get('user_id');
        return handleFinaleFounderStatus(userId, env, corsHeaders);
    }

    if (url.pathname === '/api/finale/trigger-event' && request.method === 'POST') {
        return handleFinaleTriggerEvent(request, env, corsHeaders);
    }

    return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleTelegramWebhook(request, env, corsHeaders) {
    try {
        const update = await request.json();
        console.log('Telegram update:', JSON.stringify(update));

        // Handle incoming message
        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text || '';

            // Handle /start command
            if (text === '/start' || text === '/miniapp') {
                await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, {
                    text: '🎮 Welcome to Babel Frontier - IELTS RPG!\n\n' +
                        'Click the button below to launch the game and start improving your IELTS speaking skills!',
                    reply_markup: {
                        inline_keyboard: [[
                            {
                                text: '🚀 Launch IELTS RPG',
                                web_app: { url: 'https://babel-frontier.rahrus1977.workers.dev' }
                            }
                        ]]
                    }
                });
            }
        }

        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function sendTelegramMessage(botToken, chatId, messageData) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const payload = {
        chat_id: chatId,
        ...messageData
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Telegram API error:', error);
        throw new Error(`Telegram API error: ${error}`);
    }

    return await response.json();
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
        const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

        // Call Gemini 2.5 Flash API for audio analysis
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            inline_data: {
                                mime_type: 'audio/webm',
                                data: audioBase64
                            }
                        },
                        {
                            text: `You are an expert IELTS Speaking examiner. Analyze this audio and provide:
1. Exact transcription of the speech
2. Word count
3. Fluency assessment (hesitations, pauses, repetitions)
4. Pronunciation quality (clarity, intonation, word stress)
5. Grammar accuracy
6. Vocabulary range and appropriateness
7. IELTS Band Score estimate (3.5-9.0)
8. Specific feedback for improvement

Focus on Uzbek L1 speakers' common errors (v/w confusion, article usage, third-person -s).

Respond in JSON format:
{
  "transcription": "exact words spoken",
  "word_count": number,
  "fluency_score": 1-9,
  "pronunciation_score": 1-9,
  "grammar_score": 1-9,
  "vocabulary_score": 1-9,
  "overall_band": number,
  "hesitations": number,
  "pauses_over_2s": number,
  "common_errors": ["error1", "error2"],
  "strengths": ["strength1", "strength2"],
  "feedback": "detailed improvement suggestions"
}`
                        }
                    ]
                }]
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', errorText);
            throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();

        // Extract JSON from Gemini response
        let analysisData;
        try {
            const responseText = geminiData.candidates[0].content.parts[0].text;
            // Extract JSON from markdown code blocks if present
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
            analysisData = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('Error parsing Gemini response:', parseError);
            // Fallback to basic transcription
            const responseText = geminiData.candidates[0].content.parts[0].text;
            analysisData = {
                transcription: responseText,
                word_count: responseText.split(/\s+/).filter(w => w.length > 0).length,
                overall_band: 5.0,
                feedback: "Analysis not available"
            };
        }

        const text = analysisData.transcription || '';
        const wordCount = analysisData.word_count || text.split(/\s+/).filter(w => w.length > 0).length;

        // Use pedagogy manifest for final band calculation
        const pedagogyManifest = await getPedagogyManifest();
        const analysisResult = analyzeSpeechWithPedagogy(text, wordCount, pedagogyManifest);

        // Enhance with Gemini's detailed analysis
        const damage = analysisResult.damage;
        const bandScore = analysisResult.bandScore;
        const feedback = analysisData.feedback || analysisResult.feedback;

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
            // Gemini-enhanced analysis
            gemini_analysis: {
                fluency_score: analysisData.fluency_score || 0,
                pronunciation_score: analysisData.pronunciation_score || 0,
                grammar_score: analysisData.grammar_score || 0,
                vocabulary_score: analysisData.vocabulary_score || 0,
                overall_band: analysisData.overall_band || 0,
                common_errors: analysisData.common_errors || [],
                strengths: analysisData.strengths || [],
                hesitations: analysisData.hesitations || 0,
                pauses_over_2s: analysisData.pauses_over_2s || 0
            },
            max_pause_duration: analysisData.pauses_over_2s || 0,
            pause_count: analysisData.hesitations || 0,
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

async function handleWritingAnalysis(request, env, corsHeaders) {
    try {
        const { essay, prompt, word_target } = await request.json();

        if (!essay || essay.trim().length === 0) {
            return new Response(JSON.stringify({ error: 'No essay provided' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const wordCount = essay.trim().split(/\s+/).filter(w => w.length > 0).length;

        // Call Gemini API for essay analysis
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are an expert IELTS Writing examiner. Analyze this essay using the 4 IELTS Writing criteria:\n\n**Essay Prompt:**\n${prompt}\n\n**Student's Essay:**\n${essay}\n\n**Word Count:** ${wordCount} / ${word_target}\n\nProvide detailed analysis in JSON format:\n{\n  "band_score": number (3.5-9.0),\n  "task_achievement": number (1-9),\n  "coherence": number (1-9),\n  "vocabulary": number (1-9),\n  "grammar": number (1-9),\n  "feedback": "comprehensive feedback paragraph",\n  "strengths": ["strength1", "strength2", "strength3"],\n  "errors": ["error1 with correction", "error2 with correction"]\n}\n\nFocus on Uzbek L1 writers' common issues (articles, prepositions, word order).`
                    }]
                }]
            })
        });

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();

        // Extract JSON from response
        let analysisData;
        try {
            const responseText = geminiData.candidates[0].content.parts[0].text;
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
            analysisData = JSON.parse(jsonString);
        } catch (parseError) {
            console.error('Error parsing Gemini response:', parseError);
            throw new Error('Failed to parse AI analysis');
        }

        // Return comprehensive analysis
        const response = {
            band_score: analysisData.band_score || 5.0,
            task_achievement: analysisData.task_achievement || 5,
            coherence: analysisData.coherence || 5,
            vocabulary: analysisData.vocabulary || 5,
            grammar: analysisData.grammar || 5,
            feedback: analysisData.feedback || 'Good effort!',
            strengths: analysisData.strengths || [],
            errors: analysisData.errors || [],
            wordCount: wordCount
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Writing analysis error:', error);
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

        // Initialize inventory if doesn't exist
        await db.prepare(`
      INSERT OR IGNORE INTO user_inventory (user_id)
      VALUES (?)
    `).bind(userId).run();

    } catch (error) {
        console.error('Save user progress error:', error);
    }
}

// ============================================================
// WEEK 2: MONETIZATION HANDLERS
// ============================================================

async function handleMarketplaceProducts(corsHeaders) {
    const products = [
        {
            id: 'plov_potion',
            name: 'Plov Potion Bundle',
            nameUz: 'Osh Iksiri',
            description: '5 Energy Potions',
            price: 5000,
            energyGrant: 5
        },
        {
            id: 'sultan_pass',
            name: 'Samarkand Sultan Pass',
            nameUz: 'Samarqand Sulton Pasporti',
            description: '30-day unlimited access + 20% XP boost',
            price: 150000,
            duration: 30
        },
        {
            id: 'scholarship_oracle',
            name: 'Scholarship Oracle',
            nameUz: 'Stipendiya Bashorati',
            description: 'Full IELTS Mock Test + Certificate',
            price: 300000,
            mockTests: 1
        }
    ];

    return new Response(JSON.stringify({ products }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handlePaymentInitiate(request, env, corsHeaders) {
    try {
        const { userId, productId, amount } = await request.json();

        if (!userId || !productId || !amount) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Create transaction record
        const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (env.DB) {
            await env.DB.prepare(`
                INSERT INTO transactions (user_id, transaction_id, payment_provider, product_type, amount_uzs, status)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(userId, transactionId, 'mock', productId, amount, 'pending').run();
        }

        // For now, return mock payment URL (in production, integrate with Click/Payme APIs)
        const response = {
            transactionId,
            paymentUrl: `https://mock-payment.example.com/pay?txn=${transactionId}`,
            mockPurchase: true // Flag to indicate this is a mock payment
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Payment initiation error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleGetInventory(userId, env, corsHeaders) {
    try {
        if (!env.DB) {
            // Return default inventory if DB is not available
            return new Response(JSON.stringify({
                inventory: {
                    user_id: userId,
                    energy_potions: 0,
                    current_energy: 5,
                    max_energy: 5,
                    sultan_pass_expires: null,
                    scholarship_oracle_count: 0,
                    total_spent_uzs: 0
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Initialize inventory if doesn't exist
        await env.DB.prepare(`
            INSERT OR IGNORE INTO user_inventory (user_id)
            VALUES (?)
        `).bind(userId).run();

        const inventory = await env.DB.prepare(`
            SELECT * FROM user_inventory WHERE user_id = ?
        `).bind(userId).first();

        return new Response(JSON.stringify({ inventory: inventory || {} }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get inventory error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleClickWebhook(request, env, corsHeaders) {
    // TODO: Implement Click.uz webhook signature verification
    // For now, treat as mock
    return handleMockWebhook(request, env, corsHeaders);
}

async function handlePaymeWebhook(request, env, corsHeaders) {
    // TODO: Implement Payme.uz webhook signature verification
    // For now, treat as mock
    return handleMockWebhook(request, env, corsHeaders);
}

async function handleMockWebhook(request, env, corsHeaders) {
    try {
        const { transaction_id, user_id, product_type, amount, status } = await request.json();

        if (!env.DB) {
            return new Response(JSON.stringify({ ok: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (status === 'success') {
            // Update transaction status
            await env.DB.prepare(`
                UPDATE transactions 
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                WHERE transaction_id = ?
            `).bind(transaction_id).run();

            // Grant inventory items based on product type
            switch (product_type) {
                case 'plov_potion':
                    await env.DB.prepare(`
                        UPDATE user_inventory 
                        SET energy_potions = energy_potions + 5,
                            total_spent_uzs = total_spent_uzs + ?
                        WHERE user_id = ?
                    `).bind(amount, user_id).run();
                    break;

                case 'sultan_pass':
                    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                    await env.DB.prepare(`
                        UPDATE user_inventory 
                        SET sultan_pass_expires = ?,
                            total_spent_uzs = total_spent_uzs + ?
                        WHERE user_id = ?
                    `).bind(expiresAt, amount, user_id).run();
                    break;

                case 'scholarship_oracle':
                    await env.DB.prepare(`
                        UPDATE user_inventory 
                        SET scholarship_oracle_count = scholarship_oracle_count + 1,
                            total_spent_uzs = total_spent_uzs + ?
                        WHERE user_id = ?
                    `).bind(amount, user_id).run();
                    break;
            }
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Webhook error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// WEEK 2: WRITING FOUNDRY HANDLERS
// ============================================================

async function handleWritingAnalyzeRealtime(request, env, corsHeaders) {
    try {
        const { text, userId, textHash } = await request.json();

        if (!text || text.length < 30) {
            return new Response(JSON.stringify({ analysis: null }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Check cache first
        if (env.DB && textHash) {
            const cached = await env.DB.prepare(`
                SELECT analysis_json FROM writing_analysis_cache 
                WHERE text_hash = ? AND created_at > datetime('now', '-1 hour')
            `).bind(textHash).first();

            if (cached) {
                return new Response(JSON.stringify({ analysis: JSON.parse(cached.analysis_json), cached: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Call Gemini for real-time analysis
        const prompt = `You are the Grand Vizier, an expert IELTS Writing examiner with a dramatic flair.

Analyze this partial essay text for real-time feedback:
"${text}"

Return JSON with:
{
  "cohesionWarnings": ["specific issue with sentence/paragraph connection"],
  "lexicalUpgrades": [{"word": "weak word found", "suggestions": ["C1 synonym", "C2 synonym", "Academic synonym"]}],
  "grammarSuggestions": ["suggestion for more complex structure"],
  "overallTone": "Band X.X assessment with dramatic description"
}

Focus on:
- Missing transition words (Furthermore, However, In contrast)
- Weak vocabulary (good, bad, big, important)
- Simple sentence structures (suggest subordination)
- Academic register issues`;

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500
                }
            })
        });

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates[0].content.parts[0].text;

        // Extract JSON
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
        const analysis = JSON.parse(jsonString);

        // Cache the result
        if (env.DB && textHash) {
            await env.DB.prepare(`
                INSERT OR REPLACE INTO writing_analysis_cache (text_hash, analysis_json)
                VALUES (?, ?)
            `).bind(textHash, JSON.stringify(analysis)).run();
        }

        return new Response(JSON.stringify({ analysis }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Real-time analysis error:', error);
        return new Response(JSON.stringify({ analysis: null, error: error.message }), {
            status: 200, // Return 200 to avoid breaking the UI
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleWritingSubmit(request, env, corsHeaders) {
    try {
        const { userId, essayText, prompt, wordCount } = await request.json();

        if (!essayText || wordCount < 250) {
            return new Response(JSON.stringify({ error: 'Essay must be at least 250 words' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Call Gemini for comprehensive grading
        const gradingPrompt = `You are the Grand Vizier, a dramatic and wise IELTS Writing examiner.

**Task 2 Prompt:** ${prompt}

**Student's Essay (${wordCount} words):**
${essayText}

Grade this essay as a REAL IELTS examiner would, using the 4 criteria. Then deliver feedback in the Grand Vizier's theatrical voice.

Return JSON:
{
  "bandScore": 6.5,
  "bandLabel": "Competent User",
  "taskResponse": 6.5,
  "cohesion": 6.0,
  "lexical": 7.0,
  "grammar": 6.5,
  "message": "Grand Vizier's dramatic assessment (2-3 sentences in character)",
  "improvements": ["specific actionable improvement 1", "improvement 2", "improvement 3"],
  "xpEarned": 500
}

The Grand Vizier speaks like: "Young scholar, your lexical mastery shines like silk in the sun! Yet your argument's foundation shows cracks. Attend to the mortar of cohesion."`;

        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: gradingPrompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 800
                }
            })
        });

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates[0].content.parts[0].text;

        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
        const feedback = JSON.parse(jsonString);

        // Save to database
        if (env.DB) {
            await env.DB.prepare(`
                INSERT INTO writing_submissions 
                (user_id, prompt, essay_text, word_count, band_score, task_response_score, 
                 cohesion_score, lexical_score, grammar_score, feedback_json, xp_earned)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                userId, prompt, essayText, wordCount,
                feedback.bandScore, feedback.taskResponse, feedback.cohesion,
                feedback.lexical, feedback.grammar, JSON.stringify(feedback),
                feedback.xpEarned || 500
            ).run();

            // Update user XP
            await env.DB.prepare(`
                UPDATE user_brain_state 
                SET total_xp = total_xp + ?,
                    writing_band = CASE WHEN ? > writing_band THEN ? ELSE writing_band END
                WHERE user_id = ?
            `).bind(feedback.xpEarned || 500, feedback.bandScore, feedback.bandScore, userId).run();
        }

        return new Response(JSON.stringify({ feedback }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Writing submission error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleWritingHistory(userId, env, corsHeaders) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ history: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { results } = await env.DB.prepare(`
            SELECT id, prompt, word_count, band_score, xp_earned, created_at
            FROM writing_submissions
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        `).bind(userId).all();

        return new Response(JSON.stringify({ history: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Writing history error:', error);
        return new Response(JSON.stringify({ history: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// WEEK 2 DAY 5: SOCIAL WARFARE HANDLERS
// ============================================================

async function handleRegionalMap(request, env, corsHeaders) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ regions: [], userRegion: null }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get or create regional stats
        const { results: regions } = await env.DB.prepare(`
            SELECT * FROM regional_stats ORDER BY average_band_score DESC
        `).all();

        // Get user's region from query params or default
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');
        let userRegion = null;

        if (userId) {
            const location = await env.DB.prepare(`
                SELECT region FROM user_locations WHERE user_id = ?
            `).bind(userId).first();
            userRegion = location?.region;
        }

        return new Response(JSON.stringify({ regions, userRegion }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Regional map error:', error);
        return new Response(JSON.stringify({ regions: [], userRegion: null }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleSetUserLocation(request, env, corsHeaders) {
    try {
        const { userId, region } = await request.json();

        if (!env.DB) {
            return new Response(JSON.stringify({ ok: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Set user location
        await env.DB.prepare(`
            INSERT OR REPLACE INTO user_locations (user_id, region)
            VALUES (?, ?)
        `).bind(userId, region).run();

        // Update or create regional stats
        await updateRegionalStats(env.DB, region);

        return new Response(JSON.stringify({ ok: true, region }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Set location error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function updateRegionalStats(db, region) {
    // Aggregate stats for this region
    const stats = await db.prepare(`
        SELECT 
            COUNT(DISTINCT ul.user_id) as total_users,
            AVG(ubs.speaking_band) as avg_band,
            SUM(ubs.total_xp) as total_xp
        FROM user_locations ul
        JOIN user_brain_state ubs ON ul.user_id = ubs.user_id
        WHERE ul.region = ?
    `).bind(region).first();

    await db.prepare(`
        INSERT OR REPLACE INTO regional_stats (region, total_users, average_band_score, total_xp, last_updated)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
        region,
        stats?.total_users || 0,
        stats?.avg_band || 0,
        stats?.total_xp || 0
    ).run();
}

async function handleCreateGuild(request, env, corsHeaders) {
    try {
        const { userId, guildName, guildNameUz, region } = await request.json();

        if (!env.DB) {
            return new Response(JSON.stringify({ error: 'Database unavailable' }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const result = await env.DB.prepare(`
            INSERT INTO guilds (name, name_uz, region, founder_id)
            VALUES (?, ?, ?, ?)
        `).bind(guildName, guildNameUz, region, userId).run();

        const guildId = result.meta.last_row_id;

        // Add founder as first member
        await env.DB.prepare(`
            INSERT INTO guild_members (guild_id, user_id, role)
            VALUES (?, ?, 'founder')
        `).bind(guildId, userId).run();

        return new Response(JSON.stringify({ guildId, name: guildName }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create guild error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleGetGuild(guildId, env, corsHeaders) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ error: 'Database unavailable' }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const guild = await env.DB.prepare(`
            SELECT * FROM guilds WHERE id = ?
        `).bind(guildId).first();

        const { results: members } = await env.DB.prepare(`
            SELECT gm.*, u.username
            FROM guild_members gm
            JOIN users u ON gm.user_id = u.user_id
            WHERE gm.guild_id = ?
        `).bind(guildId).all();

        return new Response(JSON.stringify({ guild, members }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get guild error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleJoinGuild(guildId, request, env, corsHeaders) {
    try {
        const { userId } = await request.json();

        await env.DB.prepare(`
            INSERT OR IGNORE INTO guild_members (guild_id, user_id)
            VALUES (?, ?)
        `).bind(guildId, userId).run();

        // Update guild member count
        await env.DB.prepare(`
            UPDATE guilds SET member_count = (SELECT COUNT(*) FROM guild_members WHERE guild_id = ?)
            WHERE id = ?
        `).bind(guildId, guildId).run();

        return new Response(JSON.stringify({ ok: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Join guild error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleRegionalLeaderboard(env, corsHeaders) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT * FROM regional_stats ORDER BY average_band_score DESC LIMIT 10
        `).all();

        return new Response(JSON.stringify({ leaderboard: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Regional leaderboard error:', error);
        return new Response(JSON.stringify({ leaderboard: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// WEEK 2 DAY 6: INFINITE PEDAGOGY HANDLERS
// ============================================================

async function handleGenerateContent(request, env, corsHeaders) {
    try {
        const { skillDomain, topic, difficultyBand, count } = await request.json();
        const batchCount = Math.min(count || 1, 10); // Max 10 at a time

        const generated = [];

        for (let i = 0; i < batchCount; i++) {
            const content = await generateReadingPassage(topic, difficultyBand, env);

            // Save to database
            if (env.DB && content) {
                const result = await env.DB.prepare(`
                    INSERT INTO ai_generated_content 
                    (content_type, skill_domain, difficulty_band, topic, title, content_text, question_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    'reading',
                    skillDomain,
                    difficultyBand,
                    topic,
                    content.title,
                    content.passage,
                    JSON.stringify(content.questions)
                ).run();

                generated.push({ id: result.meta.last_row_id, ...content });
            }
        }

        return new Response(JSON.stringify({ generated, count: generated.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Generate content error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function generateReadingPassage(topic, difficultyBand, env) {
    const prompt = `You are a CELTA-certified IELTS teacher. Generate an IELTS Reading passage:

**Topic**: ${topic}
**Target**: Uzbek teenagers (16-20)
**Difficulty**: Band ${difficultyBand}
**Length**: 600 words

Include 3 question types:
- 3 True/False/Not Given
- 3 Multiple Choice
- 2 Sentence Completion

Return JSON:
{
  "title": "engaging title",
  "passage": "full passage text",
  "questions": {
    "true_false": [{"statement": "...", "answer": "True"}],
    "multiple_choice": [{"question": "...", "options": ["A", "B", "C"], "answer": "A"}],
    "completion": [{"sentence": "The main reason is ___", "answer": "economic growth"}]
  }
}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1500 }
        })
    });

    const data = await response.json();
    const responseText = data.candidates[0].content.parts[0].text;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText);
}

async function handleGetMission(skillDomain, request, env, corsHeaders) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        // Get random unused or least-used content
        const mission = await env.DB.prepare(`
            SELECT * FROM ai_generated_content
            WHERE skill_domain = ?
            ORDER BY usage_count ASC, RANDOM()
            LIMIT 1
        `).bind(skillDomain).first();

        if (mission) {
            // Increment usage count
            await env.DB.prepare(`
                UPDATE ai_generated_content SET usage_count = usage_count + 1 WHERE id = ?
            `).bind(mission.id).run();
        }

        return new Response(JSON.stringify({ mission }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get mission error:', error);
        return new Response(JSON.stringify({ mission: null }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleUpcomingEvents(env, corsHeaders) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT * FROM live_events
            WHERE status IN ('upcoming', 'active')
            ORDER BY scheduled_start ASC
            LIMIT 5
        `).all();

        return new Response(JSON.stringify({ events: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Upcoming events error:', error);
        return new Response(JSON.stringify({ events: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleGetEvent(eventId, request, env, corsHeaders) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        const event = await env.DB.prepare(`
            SELECT * FROM live_events WHERE id = ?
        `).bind(eventId).first();

        let myContribution = 0;
        if (userId) {
            const participation = await env.DB.prepare(`
                SELECT contribution FROM event_participations
                WHERE event_id = ? AND user_id = ?
            `).bind(eventId, userId).first();
            myContribution = participation?.contribution || 0;
        }

        return new Response(JSON.stringify({ event, myContribution }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get event error:', error);
        return new Response(JSON.stringify({ event: null, myContribution: 0 }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleEventContribute(eventId, request, env, corsHeaders) {
    try {
        const { userId, contribution } = await request.json();

        // Update or create participation
        await env.DB.prepare(`
            INSERT INTO event_participations (event_id, user_id, contribution)
            VALUES (?, ?, ?)
            ON CONFLICT(event_id, user_id) DO UPDATE SET contribution = contribution + ?
        `).bind(eventId, userId, contribution, contribution).run();

        // Update event progress
        await env.DB.prepare(`
            UPDATE live_events 
            SET current_progress = current_progress + ?,
                participant_count = (SELECT COUNT(DISTINCT user_id) FROM event_participations WHERE event_id = ?)
            WHERE id = ?
        `).bind(contribution, eventId, eventId).run();

        // Check if goal reached
        const event = await env.DB.prepare(`
            SELECT * FROM live_events WHERE id = ?
        `).bind(eventId).first();

        if (event && event.current_progress >= event.goal_target) {
            await env.DB.prepare(`
                UPDATE live_events SET status = 'completed' WHERE id = ?
            `).bind(eventId).run();
        }

        return new Response(JSON.stringify({ ok: true, newProgress: event?.current_progress }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Event contribute error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleCreateEvent(request, env, corsHeaders) {
    try {
        const { title, titleUz, description, bossName, goalMetric, goalTarget, scheduledStart, scheduledEnd, rewardDescription } = await request.json();

        const result = await env.DB.prepare(`
            INSERT INTO live_events 
            (event_type, title, title_uz, description, boss_name, goal_metric, goal_target, scheduled_start, scheduled_end, reward_description)
            VALUES ('boss_raid', ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(title, titleUz, description, bossName, goalMetric, goalTarget, scheduledStart, scheduledEnd, rewardDescription).run();

        return new Response(JSON.stringify({ eventId: result.meta.last_row_id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create event error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleGetNotifications(userId, env, corsHeaders) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT * FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 20
        `).bind(userId).all();

        return new Response(JSON.stringify({ notifications: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get notifications error:', error);
        return new Response(JSON.stringify({ notifications: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// WEEK 3 DAY 15: CONFIDENCE ENGINE HANDLERS
// ============================================================

async function handleConfidenceAnalyzeStream(request, env, corsHeaders) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get('audio');
        const userId = formData.get('user_id');
        const sessionId = formData.get('session_id') || `session_${Date.now()}`;
        const chunkNumber = parseInt(formData.get('chunk_number') || '0');

        if (!audioFile || !userId) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Convert audio to base64
        const audioBuffer = await audioFile.arrayBuffer();
        const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

        // Call Gemini for prosody analysis
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            inline_data: {
                                mime_type: 'audio/webm',
                                data: audioBase64
                            }
                        },
                        {
                            text: `Analyze this audio for PROSODY and emotional confidence. Provide JSON response:
{
  "transcription": "exact words",
  "word_count": number,
  "speech_rate_wpm": number (words per minute),
  "pitch_variance_hz": number (estimated variation in Hz),
  "hesitation_count": number,
  "filler_words": ["um", "uh", "err"],
  "long_pauses": number (pauses > 2 seconds),
  "confidence_score": number (0-100, based on fluency and prosody),
  "emotional_tone": "confident/nervous/hesitant"
}

Focus on detecting hesitation markers and emotional confidence through prosody.`
                        }
                    ]
                }]
            })
        });

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates[0].content.parts[0].text;
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
        const analysisData = JSON.parse(jsonString);

        // Calculate confidence index
        const confidenceIndex = analysisData.confidence_score || 50;

        // Determine aura tier and multiplier
        let auraTier, damageMultiplier, visualEffect;
        if (confidenceIndex >= 85) {
            auraTier = 'titan';
            damageMultiplier = 2.0;
            visualEffect = 'golden_glow';
        } else if (confidenceIndex >= 70) {
            auraTier = 'warrior';
            damageMultiplier = 1.5;
            visualEffect = 'blue_aura';
        } else if (confidenceIndex >= 50) {
            auraTier = 'novice';
            damageMultiplier = 1.0;
            visualEffect = 'normal';
        } else {
            auraTier = 'spectre';
            damageMultiplier = 0.5;
            visualEffect = 'screen_glitch';
        }

        // Save to database
        if (env.DB) {
            await env.DB.prepare(`
                INSERT INTO confidence_scores 
                (user_id, session_id, chunk_number, confidence_index, pitch_variance, speech_rate, hesitation_count, filler_words, long_pauses)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                userId, sessionId, chunkNumber, confidenceIndex,
                analysisData.pitch_variance_hz || 0,
                analysisData.speech_rate_wpm || 0,
                analysisData.hesitation_count || 0,
                JSON.stringify(analysisData.filler_words || []),
                analysisData.long_pauses || 0
            ).run();

            await env.DB.prepare(`
                INSERT INTO aura_multipliers (user_id, session_id, confidence_tier, damage_multiplier, visual_effect)
                VALUES (?, ?, ?, ?, ?)
            `).bind(userId, sessionId, auraTier, damageMultiplier, visualEffect).run();
        }

        // Get filler spell suggestion if hesitation detected
        let fillerSpell = null;
        if (analysisData.hesitation_count > 0 && env.DB) {
            const spell = await env.DB.prepare(`
                SELECT filler_phrase FROM filler_suggestions 
                ORDER BY RANDOM() LIMIT 1
            `).first();
            fillerSpell = spell?.filler_phrase || "Take your time...";
        }

        return new Response(JSON.stringify({
            confidence_index: confidenceIndex,
            aura_tier: auraTier,
            damage_multiplier: damageMultiplier,
            visual_effect: visualEffect,
            prosody: {
                pitch_variance: analysisData.pitch_variance_hz || 0,
                speech_rate: analysisData.speech_rate_wpm || 0,
                hesitation_count: analysisData.hesitation_count || 0,
                filler_words: analysisData.filler_words || [],
                long_pauses: analysisData.long_pauses || 0
            },
            filler_spell: fillerSpell,
            transcription: analysisData.transcription
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Confidence analyze error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleConfidenceHistory(userId, env, corsHeaders) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ history: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { results } = await env.DB.prepare(`
            SELECT session_id, AVG(confidence_index) as avg_confidence, 
                   SUM(hesitation_count) as total_hesitations,
                   COUNT(*) as chunk_count,
                   MIN(created_at) as session_start
            FROM confidence_scores
            WHERE user_id = ?
            GROUP BY session_id
            ORDER BY session_start DESC
            LIMIT 10
        `).bind(userId).all();

        return new Response(JSON.stringify({ history: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Confidence history error:', error);
        return new Response(JSON.stringify({ history: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleGetFillerSpell(request, env, corsHeaders) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ spell: "Actually..." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const spell = await env.DB.prepare(`
            SELECT filler_phrase, context FROM filler_suggestions
            ORDER BY RANDOM() LIMIT 1
        `).first();

        return new Response(JSON.stringify({ spell: spell?.filler_phrase || "Actually...", context: spell?.context }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get filler spell error:', error);
        return new Response(JSON.stringify({ spell: "Actually..." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// WEEK 3 DAY 16: AR SCANNER HANDLERS
// ============================================================

async function handleVisionScanObject(request, env, corsHeaders) {
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image');
        const userId = formData.get('user_id');
        const location = formData.get('location') || 'Tashkent';

        if (!imageFile || !userId) {
            return new Response(JSON.stringify({ error: 'Missing image or user_id' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Convert image to base64
        const imageBuffer = await imageFile.arrayBuffer();
        const imageBase64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

        // Step 1: Identify object with Gemini Vision
        const visionResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: imageBase64
                            }
                        },
                        {
                            text: `Identify the main object in this image. Provide JSON:
{
  "object": "short name (e.g., pepsi_bottle, street_sign, phone)",
  "category": "beverage/signage/food/technology/etc",
  "description": "brief description"
}`
                        }
                    ]
                }]
            })
        });

        if (!visionResponse.ok) {
            throw new Error(`Vision API error: ${visionResponse.statusText}`);
        }

        const visionData = await visionResponse.json();
        const visionText = visionData.candidates[0].content.parts[0].text;
        const visionMatch = visionText.match(/```json\n([\s\S]*?)\n```/) || visionText.match(/\{[\s\S]*\}/);
        const objectData = JSON.parse(visionMatch ? (visionMatch[1] || visionMatch[0]) : visionText);

        // Step 2: Generate IELTS passage based on object
        const passageResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Create an IELTS Academic Reading passage (exactly 200 words) about: ${objectData.object} (${objectData.description}).

Topic suggestion: Connect it to ${objectData.category} industry, history, or societal impact.

Then create 5 heading options (only ONE is correct) for a "Heading Matching" task:
- 1 correct heading
- 4 plausible distractors

Provide JSON:
{
  "passage": "200-word IELTS passage",
  "topic": "main topic of passage",
  "headings": ["correct heading", "distractor1", "distractor2", "distractor3", "distractor4"],
  "correct_index": 0
}

Use Band 6.0-7.0 vocabulary (IELTS Academic style).`
                    }]
                }]
            })
        });

        if (!passageResponse.ok) {
            throw new Error(`Passage generation error: ${passageResponse.statusText}`);
        }

        const passageData = await passageResponse.json();
        const passageText = passageData.candidates[0].content.parts[0].text;
        const passageMatch = passageText.match(/```json\n([\s\S]*?)\n```/) || passageText.match(/\{[\s\S]*\}/);
        const passageContent = JSON.parse(passageMatch ? (passageMatch[1] || passageMatch[0]) : passageText);

        // Save to database
        let passageId = null;
        if (env.DB) {
            const result = await env.DB.prepare(`
                INSERT INTO generated_passages (source_object, passage_text, topic, headings, correct_heading)
                VALUES (?, ?, ?, ?, ?)
            `).bind(
                objectData.object,
                passageContent.passage,
                passageContent.topic,
                JSON.stringify(passageContent.headings),
                passageContent.correct_index
            ).run();
            passageId = result.meta.last_row_id;

            await env.DB.prepare(`
                INSERT INTO ar_scans (user_id, object_detected, object_category, scan_location, passage_id)
                VALUES (?, ?, ?, ?, ?)
            `).bind(userId, objectData.object, objectData.category, location, passageId).run();

            // Update achievement progress
            await env.DB.prepare(`
                INSERT INTO ar_achievements (user_id, achievement_type, scans_required, scans_completed)
                VALUES (?, 'samarkand_scholar', 3, 1)
                ON CONFLICT(user_id, achievement_type) DO UPDATE SET
                scans_completed = scans_completed + 1,
                unlocked = CASE WHEN scans_completed + 1 >= 3 THEN 1 ELSE 0 END,
                unlocked_at = CASE WHEN scans_completed + 1 >= 3 THEN CURRENT_TIMESTAMP ELSE NULL END
            `).bind(userId).run();
        }

        return new Response(JSON.stringify({
            object: objectData.object,
            category: objectData.category,
            passage: passageContent.passage,
            topic: passageContent.topic,
            headings: passageContent.headings,
            passage_id: passageId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Vision scan error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleVisionPassages(userId, env, corsHeaders) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ passages: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { results } = await env.DB.prepare(`
            SELECT ar_scans.*, generated_passages.passage_text, generated_passages.topic
            FROM ar_scans
            LEFT JOIN generated_passages ON ar_scans.passage_id = generated_passages.id
            WHERE ar_scans.user_id = ?
            ORDER BY ar_scans.created_at DESC
            LIMIT 10
        `).bind(userId).all();

        return new Response(JSON.stringify({ passages: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get passages error:', error);
        return new Response(JSON.stringify({ passages: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleVisionQuizSubmit(request, env, corsHeaders) {
    try {
        const { userId, passageId, selectedHeading } = await request.json();

        if (!env.DB) {
            return new Response(JSON.stringify({ correct: false }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const passage = await env.DB.prepare(`
            SELECT correct_heading FROM generated_passages WHERE id = ?
        `).bind(passageId).first();

        const isCorrect = passage && passage.correct_heading === selectedHeading;

        // Update scan record
        await env.DB.prepare(`
            UPDATE ar_scans
            SET quiz_completed = 1, quiz_score = ?
            WHERE passage_id = ? AND user_id = ?
        `).bind(isCorrect ? 1.0 : 0.0, passageId, userId).run();

        // Check if Samarkand Scholar unlocked
        const achievement = await env.DB.prepare(`
            SELECT * FROM ar_achievements
            WHERE user_id = ? AND achievement_type = 'samarkand_scholar'
        `).bind(userId).first();

        return new Response(JSON.stringify({
            correct: isCorrect,
            achievement_unlocked: achievement?.unlocked === 1,
            scans_completed: achievement?.scans_completed || 0,
            scans_required: achievement?.scans_required || 3
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Quiz submit error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// WEEK 3 DAY 17: B2B UNIVERSITY BRIDGE HANDLERS
// ============================================================

async function handlePartnerRegister(request, env, corsHeaders) {
    try {
        const { name, nameUz, country, contactEmail, contactPhone } = await request.json();

        if (!name || !contactEmail) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const authToken = `partner_${country.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`;

        if (env.DB) {
            const result = await env.DB.prepare(`
                INSERT INTO university_partners (name, name_uz, country, contact_email, contact_phone, auth_token)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(name, nameUz || name, country, contactEmail, contactPhone || '', authToken).run();

            return new Response(JSON.stringify({
                partner_id: result.meta.last_row_id,
                auth_token: authToken,
                message: 'Partner registered successfully'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Database not available' }), {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Partner register error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handlePartnerLeads(partnerId, request, env, corsHeaders) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ leads: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Verify auth token
        const url = new URL(request.url);
        const authToken = url.searchParams.get('auth_token');

        const partner = await env.DB.prepare(`
            SELECT * FROM university_partners WHERE id = ? AND auth_token = ?
        `).bind(partnerId, authToken).first();

        if (!partner) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const { results } = await env.DB.prepare(`
            SELECT * FROM placement_leads
            WHERE partner_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `).bind(partnerId).all();

        return new Response(JSON.stringify({ leads: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get partner leads error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleConsultationBook(request, env, corsHeaders) {
    try {
        const { userId, partnerId, consultationDate, meetingLink, studentNotes } = await request.json();

        if (!env.DB) {
            return new Response(JSON.stringify({ error: 'Database not available' }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Find or create lead
        const lead = await env.DB.prepare(`
            SELECT * FROM placement_leads WHERE user_id = ? AND partner_id = ?
        `).bind(userId, partnerId).first();

        let leadId = lead?.id;
        if (!leadId) {
            // Create new lead
            const result = await env.DB.prepare(`
                INSERT INTO placement_leads (user_id, partner_id, band_score, status)
                VALUES (?, ?, 7.5, 'new')
            `).bind(userId, partnerId).run();
            leadId = result.meta.last_row_id;
        }

        // Create booking
        const bookingResult = await env.DB.prepare(`
            INSERT INTO consultation_bookings 
            (lead_id, user_id, partner_id, consultation_date, meeting_link, student_notes)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(leadId, userId, partnerId, consultationDate, meetingLink || '', studentNotes || '').run();

        // Update lead status
        await env.DB.prepare(`
            UPDATE placement_leads SET status = 'consultation_booked' WHERE id = ?
        `).bind(leadId).run();

        return new Response(JSON.stringify({
            booking_id: bookingResult.meta.last_row_id,
            lead_id: leadId,
            message: 'Consultation booked successfully'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Consultation book error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handlePartnerAnalytics(partnerId, request, env, corsHeaders) {
    try {
        if (!env.DB) {
            return new Response(JSON.stringify({ analytics: {} }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Verify auth
        const url = new URL(request.url);
        const authToken = url.searchParams.get('auth_token');

        const partner = await env.DB.prepare(`
            SELECT * FROM university_partners WHERE id = ? AND auth_token = ?
        `).bind(partnerId, authToken).first();

        if (!partner) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const stats = await env.DB.prepare(`
            SELECT 
                COUNT(*) as total_leads,
                SUM(CASE WHEN status = 'consultation_booked' THEN 1 ELSE 0 END) as consultations_booked,
                SUM(CASE WHEN status = 'placed' THEN 1 ELSE 0 END) as placements,
                AVG(band_score) as avg_band_score
            FROM placement_leads
            WHERE partner_id = ?
        `).bind(partnerId).first();

        const revenue = await env.DB.prepare(`
            SELECT SUM(amount_uzs) as total_revenue
            FROM placement_fees
            WHERE partner_id = ? AND status = 'paid'
        `).bind(partnerId).first();

        return new Response(JSON.stringify({
            analytics: {
                total_leads: stats?.total_leads || 0,
                consultations_booked: stats?.consultations_booked || 0,
                placements: stats?.placements || 0,
                avg_band_score: stats?.avg_band_score || 0,
                total_revenue_uzs: revenue?.total_revenue || 0,
                conversion_rate: stats?.total_leads > 0 ?
                    ((stats.consultations_booked / stats.total_leads) * 100).toFixed(1) : 0
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Partner analytics error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleLeadTrigger(request, env, corsHeaders) {
    try {
        const { userId, bandScore, studentName, studentEmail, studentPhone, targetCountry } = await request.json();

        if (bandScore < 7.5) {
            return new Response(JSON.stringify({ message: 'Band score too low for lead generation' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!env.DB) {
            return new Response(JSON.stringify({ error: 'Database not available' }), {
                status: 503,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get all active partners
        const { results: partners } = await env.DB.prepare(`
            SELECT id FROM university_partners WHERE active = 1
        `).all();

        // Create leads for all partners
        for (const partner of partners) {
            await env.DB.prepare(`
                INSERT OR IGNORE INTO placement_leads 
                (user_id, partner_id, band_score, student_name, student_email, student_phone, target_country)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).bind(userId, partner.id, bandScore, studentName || '', studentEmail || '', studentPhone || '', targetCountry || 'UK').run();
        }

        return new Response(JSON.stringify({
            message: 'Embassy Mission triggered',
            leads_created: partners.length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Lead trigger error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
// ============================================================
// DAYS 18-20: SOVEREIGN PHASE HANDLERS
// ============================================================

// ============================================================
// DAY 18: PHILOSOPHER'S DUEL HANDLERS
// ============================================================

async function handleDebateStart(request, env, corsHeaders) {
    try {
        const { userId, philosopher } = await request.json();

        if (!userId || !philosopher) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get random Task 2 prompt
        const prompt = await env.DB.prepare(`
            SELECT * FROM task2_prompts 
            ORDER BY RANDOM() LIMIT 1
        `).first();

        // Create debate session
        const result = await env.DB.prepare(`
            INSERT INTO debate_sessions (user_id, philosopher, task2_prompt)
            VALUES (?, ?, ?)
        `).bind(userId, philosopher, prompt.prompt_text).run();

        return new Response(JSON.stringify({
            debate_id: result.meta.last_row_id,
            philosopher,
            prompt: prompt.prompt_text,
            topic: prompt.topic
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Debate start error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleDebateSubmitArgument(request, env, corsHeaders) {
    try {
        const { debateId, argumentText } = await request.json();

        // Analyze argument for fallacies and complexity
        const analysis = await analyzeArgumentLogic(argumentText, env);

        // Save argument
        await env.DB.prepare(`
            INSERT INTO logical_arguments 
            (debate_id, turn_number, speaker, argument_text, fallacies_detected, sentence_structures, complexity_score)
            VALUES (?, (SELECT COALESCE(MAX(turn_number), 0) + 1 FROM logical_arguments WHERE debate_id = ?), 'student', ?, ?, ?, ?)
        `).bind(
            debateId, debateId, argumentText,
            JSON.stringify(analysis.fallacies),
            JSON.stringify(analysis.structures),
            analysis.complexityScore
        ).run();

        // Update debate session
        await env.DB.prepare(`
            UPDATE debate_sessions
            SET turns_count = turns_count + 1,
                complexity_score = complexity_score + ?
            WHERE id = ?
        `).bind(analysis.complexityScore, debateId).run();

        return new Response(JSON.stringify({
            analysis,
            turn_saved: true
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Submit argument error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function analyzeArgumentLogic(argumentText, env) {
    // Call Gemini 2.5 Reasoning Engine
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `You are a logic professor. Analyze this argument for logical fallacies and sentence complexity:

"${argumentText}"

Identify:
1. Logical fallacies (false cause, hasty generalization, straw man, appeal to emotion, etc.)
2. Complex sentence structures used (conditional "If...then", concession "Although...", contrast "While...")
3. Argument depth score (0-10)

Respond in JSON:
{
  "fallacies": ["fallacy name and explanation"],
  "structures": ["conditional", "concession", "contrast"],
  "complexityScore": 0-10,
  "feedback": "brief improvement suggestion"
}`
                }]
            }]
        })
    });

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates[0].content.parts[0].text;
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;

    return JSON.parse(jsonString);
}

async function handleDebateCounterargument(request, env, corsHeaders) {
    try {
        const { debateId } = await request.json();

        // Get debate context
        const debate = await env.DB.prepare(`
            SELECT * FROM debate_sessions WHERE id = ?
        `).bind(debateId).first();

        // Get last student argument
        const lastArg = await env.DB.prepare(`
            SELECT * FROM logical_arguments
            WHERE debate_id = ? AND speaker = 'student'
            ORDER BY turn_number DESC LIMIT 1
        `).bind(debateId).first();

        // Generate philosopher's counter-argument
        const counterArg = await generatePhilosopherResponse(
            debate.philosopher,
            debate.task2_prompt,
            lastArg.argument_text,
            env
        );

        // Save AI response
        await env.DB.prepare(`
            INSERT INTO logical_arguments 
            (debate_id, turn_number, speaker, argument_text, complexity_score)
            VALUES (?, (SELECT COALESCE(MAX(turn_number), 0) + 1 FROM logical_arguments WHERE debate_id = ?), 'ai', ?, 8.0)
        `).bind(debateId, debateId, counterArg).run();

        return new Response(JSON.stringify({
            philosopher: debate.philosopher,
            counterargument: counterArg
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Counterargument error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function generatePhilosopherResponse(philosopher, prompt, studentArgument, env) {
    const personas = {
        socrates: 'You are Socrates. Use Socratic questioning to expose logical flaws. Be wise and probing.',
        al_khwarizmi: 'You are Al-Khwarizmi, the Persian mathematician. Use logical reasoning and mathematical thinking. Be precise and analytical.',
        steve_jobs: 'You are Steve Jobs. Challenge assumptions with innovative thinking. Be direct and visionary.'
    };

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `${personas[philosopher] || personas.socrates}

Task: ${prompt}

Student's argument: "${studentArgument}"

Challenge their logic. Point out flaws or weak reasoning. Ask a probing question that forces them to use complex sentence structures (Although..., While..., If...) to respond.

Keep response under 100 words. Respond in character.`
                }]
            }]
        })
    });

    const geminiData = await geminiResponse.json();
    return geminiData.candidates[0].content.parts[0].text;
}

async function handleDebateHistory(userId, env, corsHeaders) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT * FROM debate_sessions
            WHERE user_id = ?
            ORDER BY started_at DESC
            LIMIT 10
        `).bind(userId).all();

        return new Response(JSON.stringify({ debates: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Debate history error:', error);
        return new Response(JSON.stringify({ debates: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// DAY 19: THE GREAT GAME HANDLERS
// ============================================================

async function handleNationalJoinTeam(request, env, corsHeaders) {
    try {
        const { userId, cityName, regionName } = await request.json();

        await env.DB.prepare(`
            INSERT OR REPLACE INTO city_registrations (user_id, city_name, region_name)
            VALUES (?, ?, ?)
        `).bind(userId, cityName, regionName || cityName).run();

        return new Response(JSON.stringify({
            message: `Joined team ${cityName}`,
            city: cityName
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Join team error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleNationalLiveScores(env, corsHeaders) {
    try {
        // Get active battle
        const battle = await env.DB.prepare(`
            SELECT * FROM regional_battles
            WHERE status = 'active'
            ORDER BY scheduled_time DESC
            LIMIT 1
        `).first();

        if (!battle) {
            return new Response(JSON.stringify({
                active_battle: null,
                message: 'No active battles'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Calculate live scores
        const cityAScore = await env.DB.prepare(`
            SELECT COALESCE(SUM(score), 0) as total
            FROM team_contributions
            WHERE battle_id = ? AND city = ?
        `).bind(battle.id, battle.city_a).first();

        const cityBScore = await env.DB.prepare(`
            SELECT COALESCE(SUM(score), 0) as total
            FROM team_contributions
            WHERE battle_id = ? AND city = ?
        `).bind(battle.id, battle.city_b).first();

        return new Response(JSON.stringify({
            battle: {
                id: battle.id,
                name: battle.battle_name,
                city_a: battle.city_a,
                city_b: battle.city_b,
                city_a_score: cityAScore.total,
                city_b_score: cityBScore.total,
                time_remaining: calculateTimeRemaining(battle.battle_end)
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Live scores error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

function calculateTimeRemaining(endTime) {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    return Math.max(0, Math.floor(diff / 1000)); // seconds
}

async function handleNationalContributeScore(request, env, corsHeaders) {
    try {
        const { userId, battleId, contributionType, score } = await request.json();

        // Get user's city
        const userCity = await env.DB.prepare(`
            SELECT city_name FROM city_registrations WHERE user_id = ?
        `).bind(userId).first();

        if (!userCity) {
            return new Response(JSON.stringify({ error: 'User not registered to a city' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Add contribution
        await env.DB.prepare(`
            INSERT INTO team_contributions (battle_id, user_id, city, contribution_type, score)
            VALUES (?, ?, ?, ?, ?)
        `).bind(battleId, userId, userCity.city_name, contributionType, score).run();

        // Update user's total contributions
        await env.DB.prepare(`
            UPDATE city_registrations
            SET total_contributions = total_contributions + 1
            WHERE user_id = ?
        `).bind(userId).run();

        return new Response(JSON.stringify({
            message: 'Contribution recorded',
            city: userCity.city_name,
            score
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Contribute score error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleNationalTerritoryMap(env, corsHeaders) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT * FROM territory_control
        `).all();

        return new Response(JSON.stringify({ territories: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Territory map error:', error);
        return new Response(JSON.stringify({ territories: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleNationalScheduleBattle(request, env, corsHeaders) {
    try {
        const { battleName, cityA, cityB, scheduledTime } = await request.json();

        const result = await env.DB.prepare(`
            INSERT INTO regional_battles (battle_name, city_a, city_b, scheduled_time)
            VALUES (?, ?, ?, ?)
        `).bind(battleName, cityA, cityB, scheduledTime).run();

        return new Response(JSON.stringify({
            battle_id: result.meta.last_row_id,
            message: 'Battle scheduled'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Schedule battle error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// DAY 20: ORACLE'S SEAL HANDLERS
// ============================================================

async function handleOraclePredict(userId, env, corsHeaders) {
    try {
        // Gather last 20 days of performance data
        const snapshots = await env.DB.prepare(`
            SELECT * FROM daily_performance_snapshots
            WHERE user_id = ?
            ORDER BY snapshot_date DESC
            LIMIT 20
        `).bind(userId).all();

        if (!snapshots.results || snapshots.results.length < 5) {
            return new Response(JSON.stringify({
                error: 'Insufficient data for prediction (need at least 5 days)'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Calculate prediction
        const prediction = calculateBandPrediction(snapshots.results);

        // Save prediction
        const result = await env.DB.prepare(`
            INSERT INTO prediction_models 
            (user_id, current_band, predicted_date, confidence_pct, days_to_target, weakest_area, improvement_rate)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
            userId,
            prediction.currentBand,
            prediction.predictedDate,
            prediction.confidencePct,
            prediction.daysToTarget,
            prediction.weakestArea,
            prediction.improvementRate
        ).run();

        return new Response(JSON.stringify({
            prediction: {
                ...prediction,
                prediction_id: result.meta.last_row_id
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Oracle predict error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

function calculateBandPrediction(snapshots) {
    // Simple linear regression on speaking band scores
    const bands = snapshots.map(s => s.speaking_band).reverse();
    const n = bands.length;

    // Calculate improvement rate
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += bands[i];
        sumXY += i * bands[i];
        sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const currentBand = bands[bands.length - 1];
    const targetBand = 7.5;
    const improvementRate = slope;

    // Calculate days to target
    let daysToTarget = improvementRate > 0
        ? Math.ceil((targetBand - currentBand) / improvementRate)
        : 999;

    if (daysToTarget < 0) daysToTarget = 0;
    if (daysToTarget > 365) daysToTarget = 365;

    // Predicted date
    const today = new Date();
    const predictedDate = new Date(today.getTime() + daysToTarget * 24 * 60 * 60 * 1000);

    // Confidence based on consistency
    const variance = calculateVariance(bands.map((b, i) => b - (intercept + slope * i)));
    const confidencePct = Math.max(60, Math.min(95, 95 - variance * 10));

    // Identify weakest area
    const latest = snapshots[0];
    const weaknesses = {
        fluency: latest.fluency_score || 5,
        vocabulary: latest.vocabulary_diversity || 5,
        grammar: latest.grammar_accuracy || 5,
        task_response: latest.task_response_depth || 5
    };

    const weakestArea = Object.keys(weaknesses).reduce((a, b) =>
        weaknesses[a] < weaknesses[b] ? a : b
    );

    return {
        currentBand,
        targetBand,
        predictedDate: predictedDate.toISOString().split('T')[0],
        confidencePct: Math.round(confidencePct),
        daysToTarget,
        weakestArea,
        improvementRate: slope.toFixed(3)
    };
}

function calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

async function handleOracleWeaknesses(userId, env, corsHeaders) {
    try {
        const latest = await env.DB.prepare(`
            SELECT * FROM daily_performance_snapshots
            WHERE user_id = ?
            ORDER BY snapshot_date DESC
            LIMIT 1
        `).bind(userId).first();

        if (!latest) {
            return new Response(JSON.stringify({ weaknesses: {} }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const weaknesses = {
            fluency: { score: latest.fluency_score || 5, label: 'Fluency & Coherence' },
            vocabulary: { score: latest.vocabulary_diversity || 5, label: 'Lexical Resource' },
            grammar: { score: latest.grammar_accuracy || 5, label: 'Grammatical Range' },
            task_response: { score: latest.task_response_depth || 5, label: 'Task Achievement' }
        };

        return new Response(JSON.stringify({ weaknesses }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Weaknesses error:', error);
        return new Response(JSON.stringify({ weaknesses: {} }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleOracleVocabularyRec(userId, env, corsHeaders) {
    try {
        // Get user's weakest area
        const prediction = await env.DB.prepare(`
            SELECT weakest_area FROM prediction_models
            WHERE user_id = ?
            ORDER BY generated_at DESC
            LIMIT 1
        `).bind(userId).first();

        // Generate 50 vocabulary recommendations (mock for now)
        const vocab = generateVocabularyRecommendations(prediction?.weakest_area || 'general');

        // Save to DB
        for (const word of vocab.slice(0, 10)) { // Save top 10
            await env.DB.prepare(`
                INSERT OR IGNORE INTO vocabulary_recommendations (user_id, word, definition, example_sentence)
                VALUES (?, ?, ?, ?)
            `).bind(userId, word.word, word.definition, word.example).run();
        }

        return new Response(JSON.stringify({ vocabulary: vocab }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Vocabulary rec error:', error);
        return new Response(JSON.stringify({ vocabulary: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

function generateVocabularyRecommendations(weakArea) {
    // Mock high-value IELTS vocabulary
    const vocab = [
        { word: 'furthermore', definition: 'in addition', example: 'Furthermore, this approach yields better results.' },
        { word: 'nevertheless', definition: 'in spite of that', example: 'Nevertheless, the challenges persist.' },
        { word: 'consequently', definition: 'as a result', example: 'Consequently, profits increased significantly.' },
        { word: 'substantial', definition: 'considerable', example: 'There was substantial improvement.' },
        { word: 'implement', definition: 'put into effect', example: 'We will implement new policies.' }
        // ... would have 45 more in production
    ];

    return vocab.slice(0, 50);
}

async function handleOracleBookExam(request, env, corsHeaders) {
    try {
        const { userId, examDate, testCenter } = await request.json();

        // Mock exam booking (in production, integrate with BC/IDP API)
        const bookingId = `BC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const examFee = 2500000; // UZS
        const commission = examFee * 0.1;

        const result = await env.DB.prepare(`
            INSERT INTO exam_bookings (user_id, booking_id, exam_date, test_center, exam_fee_uzs, commission_uzs)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(userId, bookingId, examDate, testCenter, examFee, commission).run();

        return new Response(JSON.stringify({
            booking_id: bookingId,
            exam_date: examDate,
            test_center: testCenter,
            fee_uzs: examFee,
            message: 'Exam booked successfully (Mock)'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Book exam error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleOracleSeal(userId, env, corsHeaders) {
    try {
        // Get latest prediction
        const prediction = await env.DB.prepare(`
            SELECT * FROM prediction_models
            WHERE user_id = ?
            ORDER BY generated_at DESC
            LIMIT 1
        `).bind(userId).first();

        if (!prediction) {
            return new Response(JSON.stringify({ error: 'No prediction available' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Generate seal
        const sealNumber = `SEAL_${userId}_${Date.now()}`;
        const readinessPercentage = Math.min(100, (prediction.current_band / 7.5) * 100);

        await env.DB.prepare(`
            INSERT INTO readiness_seals (user_id, prediction_id, seal_number, current_band, predicted_band, readiness_percentage)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(userId, prediction.id, sealNumber, prediction.current_band, prediction.target_band, readinessPercentage).run();

        return new Response(JSON.stringify({
            seal: {
                seal_number: sealNumber,
                current_band: prediction.current_band,
                predicted_band: prediction.target_band,
                predicted_date: prediction.predicted_date,
                confidence: prediction.confidence_pct,
                readiness_percentage: Math.round(readinessPercentage),
                issued_at: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Oracle seal error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
// ============================================================
// WEEK 4: TITAN PHASE HANDLERS (DAYS 22-28)
// ============================================================

// Note: This is a foundational implementation. Some features require
// external libraries not available in Cloudflare Workers (3D engines, DSP).
// These handlers provide API structure and mock functionality.

// ============================================================
// DAY 22: SPATIAL RAIDS HANDLERS
// ============================================================

async function handleVRStartSession(request, env, corsHeaders) {
    try {
        const { userId, scenarioType } = await request.json();

        const result = await env.DB.prepare(`
            INSERT INTO vr_sessions (user_id, scenario_type, gyroscope_enabled)
            VALUES (?, ?, 1)
        `).bind(userId, scenarioType || 'london_underground').run();

        return new Response(JSON.stringify({
            session_id: result.meta.last_row_id,
            scenario: scenarioType,
            message: 'VR session started'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('VR start session error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleVRGyroscopeData(request, env, corsHeaders) {
    try {
        const { sessionId, alpha, beta, gamma, timestamp } = await request.json();

        await env.DB.prepare(`
            INSERT INTO gyroscope_movements (session_id, timestamp_ms, alpha, beta, gamma)
            VALUES (?, ?, ?, ?, ?)
        `).bind(sessionId, timestamp, alpha, beta, gamma).run();

        return new Response(JSON.stringify({ recorded: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('VR gyroscope error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleVRDiscoverArtifact(artifactId, request, env, corsHeaders) {
    try {
        const { userId, sessionId } = await request.json();

        // Record discovery
        await env.DB.prepare(`
            INSERT INTO artifact_discoveries (user_id, session_id, artifact_id)
            VALUES (?, ?, ?)
        `).bind(userId, sessionId, artifactId).run();

        // Get artifact details
        const artifact = await env.DB.prepare(`
            SELECT * FROM vr_artifacts WHERE id = ?
        `).bind(artifactId).first();

        return new Response(JSON.stringify({
            artifact,
            message: `Discovered ${artifact?.artifact_name}!`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('VR discover artifact error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// DAY 23: NEURAL MIRRORING HANDLERS
// ============================================================

async function handleNeuralAnalyzeWaveform(request, env, corsHeaders) {
    try {
        const { userId, recordingId, nativeModelId } = await request.json();

        // Mock waveform analysis (real implementation needs audio DSP library)
        const similarityScore = 60 + Math.random() * 30; // 60-90
        const stressAlignment = 50 + Math.random() * 40;
        const intonationAlignment = 55 + Math.random() * 35;
        const rhythmScore = 50 + Math.random() * 40;

        await env.DB.prepare(`
            INSERT INTO waveform_analyses 
            (user_id, recording_id, native_model_id, similarity_score, stress_alignment_score, intonation_alignment_score, rhythm_score)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(userId, recordingId, nativeModelId, similarityScore, stressAlignment, intonationAlignment, rhythmScore).run();

        return new Response(JSON.stringify({
            similarity_score: Math.round(similarityScore),
            stress_alignment: Math.round(stressAlignment),
            intonation_alignment: Math.round(intonationAlignment),
            rhythm_score: Math.round(rhythmScore),
            overall_match: Math.round((similarityScore + stressAlignment + intonationAlignment + rhythmScore) / 4)
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Neural waveform error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleNeuralDetectNuance(request, env, corsHeaders) {
    try {
        const { userId, phrase } = await request.json();

        // Use Gemini to detect nuance
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Analyze this phrase for nuance (irony, sarcasm, understatement):

"${phrase}"

Respond in JSON:
{
  "nuance_detected": "irony|sarcasm|understatement|none",
  "confidence": 0-100,
  "emotional_tone": "amused|serious|neutral|other",
  "explanation": "brief explanation"
}`
                    }]
                }]
            })
        });

        const geminiData = await geminiResponse.json();
        const responseText = geminiData.candidates[0].content.parts[0].text;
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
        const analysis = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : '{}');

        const diplomaticImmunity = analysis.nuance_detected !== 'none' && analysis.confidence > 70;

        await env.DB.prepare(`
            INSERT INTO nuance_detections (user_id, phrase, detected_nuance, confidence_score, emotional_tone, diplomatic_immunity_earned)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(userId, phrase, analysis.nuance_detected || 'none', analysis.confidence || 0, analysis.emotional_tone || 'neutral', diplomaticImmunity ? 1 : 0).run();

        return new Response(JSON.stringify({
            ...analysis,
            diplomatic_immunity_earned: diplomaticImmunity
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Neural nuance error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// DAY 24: NATIONAL TOURNAMENT HANDLERS
// ============================================================

async function handleTournamentCreate(request, env, corsHeaders) {
    try {
        const { tournamentName, prizePoolUzs, startDate, maxParticipants } = await request.json();

        const result = await env.DB.prepare(`
            INSERT INTO tournaments (tournament_name, tournament_type, prize_pool_uzs, start_date, max_participants)
            VALUES (?, 'national', ?, ?, ?)
        `).bind(tournamentName, prizePoolUzs || 0, startDate, maxParticipants || 100000).run();

        return new Response(JSON.stringify({
            tournament_id: result.meta.last_row_id,
            message: 'Tournament created'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Tournament create error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleTournamentRegister(request, env, corsHeaders) {
    try {
        const { tournamentId, userId, city, currentBand } = await request.json();

        await env.DB.prepare(`
            INSERT INTO tournament_registrations (tournament_id, user_id, city, current_band)
            VALUES (?, ?, ?, ?)
        `).bind(tournamentId, userId, city, currentBand).run();

        // Update participant count
        await env.DB.prepare(`
            UPDATE tournaments
            SET current_participants = current_participants + 1
            WHERE id = ?
        `).bind(tournamentId).run();

        return new Response(JSON.stringify({
            message: 'Registered for tournament',
            city
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Tournament register error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleTournamentBrackets(tournamentId, env, corsHeaders) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT * FROM tournament_brackets
            WHERE tournament_id = ?
            ORDER BY round_number, match_number
        `).bind(tournamentId).all();

        return new Response(JSON.stringify({ brackets: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Tournament brackets error:', error);
        return new Response(JSON.stringify({ brackets: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleTournamentSubmitMatch(request, env, corsHeaders) {
    try {
        const { bracketId, winnerId, player1Score, player2Score } = await request.json();

        await env.DB.prepare(`
            UPDATE tournament_brackets
            SET winner_id = ?, player1_score = ?, player2_score = ?, completed = 1
            WHERE id = ?
        `).bind(winnerId, player1Score, player2Score, bracketId).run();

        return new Response(JSON.stringify({
            message: 'Match result submitted',
            winner_id: winnerId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Tournament submit match error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// DAY 25: SERIES A DATA ROOM HANDLERS
// =============================================================

async function handleMetricsDaily(env, corsHeaders) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT * FROM daily_metrics
            ORDER BY metric_date DESC
            LIMIT 90
        `).all();

        return new Response(JSON.stringify({ daily_metrics: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Metrics daily error:', error);
        return new Response(JSON.stringify({ daily_metrics: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleMetricsLTV(env, corsHeaders) {
    try {
        // Calculate aggregate LTV metrics
        const stats = await env.DB.prepare(`
            SELECT
                AVG(ltv_calculated) as avg_ltv,
                AVG(total_revenue_uzs) as avg_revenue,
                SUM(retention_day_30) * 100.0 / COUNT(*) as retention_rate_30
            FROM user_ltv
        `).first();

        return new Response(JSON.stringify({
            avg_ltv_uzs: Math.round(stats?.avg_ltv || 0),
            avg_revenue_uzs: Math.round(stats?.avg_revenue || 0),
            retention_rate_30: Math.round(stats?.retention_rate_30 || 0)
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Metrics LTV error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleMetricsMarketProjections(env, corsHeaders) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT * FROM market_projections
            ORDER BY projected_year_1_revenue_usd DESC
        `).all();

        return new Response(JSON.stringify({ market_projections: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Market projections error:', error);
        return new Response(JSON.stringify({ market_projections: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// DAY 26: MULTI-REGION HANDLERS
// ============================================================

async function handleRegionConfig(countryCode, env, corsHeaders) {
    try {
        const config = await env.DB.prepare(`
            SELECT * FROM regional_configs WHERE country_code = ?
        `).bind(countryCode || 'UZ').first();

        return new Response(JSON.stringify({ config }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Region config error:', error);
        return new Response(JSON.stringify({ config: null }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleRegionLocalizedContent(countryCode, env, corsHeaders) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT * FROM localized_content WHERE country_code = ?
        `).bind(countryCode || 'UZ').all();

        return new Response(JSON.stringify({ content: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Localized content error:', error);
        return new Response(JSON.stringify({ content: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// DAY 27: AI GOVERNANCE HANDLERS
// ============================================================

async function handleGovernanceHealth(env, corsHeaders) {
    try {
        // Mock system health check
        const health = {
            cpu_usage_percent: 45 + Math.random() * 30,
            memory_usage_percent: 50 + Math.random() * 20,
            active_connections: Math.floor(Math.random() * 1000),
            requests_per_minute: Math.floor(Math.random() * 5000),
            error_rate_percent: Math.random() * 2,
            avg_response_time_ms: 50 + Math.random() * 100,
            status: 'healthy'
        };

        await env.DB.prepare(`
            INSERT INTO system_health 
            (cpu_usage_percent, memory_usage_percent, active_connections, requests_per_minute, error_rate_percent, avg_response_time_ms, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(health.cpu_usage_percent, health.memory_usage_percent, health.active_connections,
            health.requests_per_minute, health.error_rate_percent, health.avg_response_time_ms, health.status).run();

        return new Response(JSON.stringify({ health }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Governance health error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleGovernanceAlerts(env, corsHeaders) {
    try {
        const { results } = await env.DB.prepare(`
            SELECT * FROM automated_alerts
            WHERE resolved = 0
            ORDER BY triggered_at DESC
            LIMIT 20
        `).all();

        return new Response(JSON.stringify({ alerts: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Governance alerts error:', error);
        return new Response(JSON.stringify({ alerts: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ============================================================
// DAY 28: CORONATION HANDLERS
// ============================================================

async function handleFinaleFounderStatus(userId, env, corsHeaders) {
    try {
        const founder = await env.DB.prepare(`
            SELECT * FROM founder_achievements WHERE user_id = ?
        `).bind(userId).first();

        return new Response(JSON.stringify({
            is_founder: !!founder,
            founder_number: founder?.founder_number,
            title: founder?.title,
            granted_at: founder?.granted_at
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Founder status error:', error);
        return new Response(JSON.stringify({ is_founder: false }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function handleFinaleTriggerEvent(request, env, corsHeaders) {
    try {
        const { eventType } = await request.json();

        const result = await env.DB.prepare(`
            INSERT INTO finale_events (event_type, participants)
            VALUES (?, 1)
        `).bind(eventType || 'coronation').run();

        return new Response(JSON.stringify({
            event_id: result.meta.last_row_id,
            message: `${eventType} event triggered!`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Finale event error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
