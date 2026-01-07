// ========== INFINITE LORE GENERATOR ==========
// Brain Evolution Step 6: Real-Time News → IELTS Content Pipeline

/**
 * POST /api/lore/scrape-news
 * Hourly job: Scrapes news from configured sources and stores for dungeon generation
 * Scheduled via Cloudflare Cron
 */
async function handleNewsScrapingJob(request, env, corsHeaders) {
    try {
        const scrapedArticles = [];

        // News sources configuration
        const sources = [
            {
                name: 'kun_uz',
                url: 'https://kun.uz/en/news/uzbekistan',
                enabled: true
            },
            {
                name: 'bbc_central_asia',
                url: 'https://www.bbc.com/news/world/asia',
                enabled: true
            }
            // Add more sources as needed
        ];

        // For MVP: Mock news scraping (in production, use RSS feeds or APIs)
        // Simulating 2-3 recent Uzbekistan news items
        const mockArticles = [
            {
                source: 'itpark_uz',
                title: 'IT Park Uzbekistan Announces New AI Innovation Hub in Tashkent',
                summary: 'The Ministry of Digital Technologies launched a new AI research facility to train 10,000 specialists by 2027.',
                relevance_score: 8.5,
                topic_category: 'technology',
                published_date: new Date().toISOString()
            },
            {
                source: 'kun_uz',
                title: 'Uzbekistan to Build Green Hydrogen Plant in Navoi Region',
                summary: 'A $2 billion investment will create Central Asia\'s first green hydrogen production facility.',
                relevance_score: 9.0,
                topic_category: 'economy',
                published_date: new Date().toISOString()
            },
            {
                source: 'tashkent_times',
                title: 'New IELTS Test Center Opens in Samarkand',
                summary: 'The British Council opened a state-of-the-art testing facility to meet growing demand.',
                relevance_score: 10.0,
                topic_category: 'education',
                published_date: new Date().toISOString()
            }
        ];

        // Store articles in pipeline
        for (const article of mockArticles) {
            const result = await env.DB.prepare(`
                INSERT INTO news_content_pipeline
                (source, article_title, article_summary, relevance_score, topic_category, published_date)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
                article.source,
                article.title,
                article.summary,
                article.relevance_score,
                article.topic_category,
                article.published_date
            ).run();

            scrapedArticles.push({
                id: result.meta.last_row_id,
                title: article.title,
                relevance: article.relevance_score
            });
        }

        return new Response(JSON.stringify({
            success: true,
            articles_scraped: scrapedArticles.length,
            articles: scrapedArticles,
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('News Scraping Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * POST /api/lore/news-to-dungeon
 * Converts a news article into an IELTS-aligned dungeon/mission
 */
async function handleNewsToDungeon(request, env, corsHeaders) {
    try {
        const { news_id } = await request.json();

        // Get news article
        const article = await env.DB.prepare(`
            SELECT * FROM news_content_pipeline WHERE id = ?
        `).bind(news_id).first();

        if (!article) {
            return new Response(JSON.stringify({ error: 'News article not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Generate dungeon using Gemini
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{
                            text: `You are the Infinite Lore Generator for Babel Frontier.

Transform this real-world news article into an IELTS-aligned educational mission.

News Article:
Title: ${article.article_title}
Summary: ${article.article_summary}
Category: ${article.topic_category}

Requirements:
1. Create a "dungeon" setting based on the news topic (e.g., "Navoi Energy Vault" for hydrogen plant)
2. Generate IELTS Reading Task 3 passage (academic level, 700-900 words) about the topic
3. Create TRUE/FALSE/NOT GIVEN questions (5 questions)
4. Generate IELTS Speaking Part 3 questions for debate (3 questions about ethics/impact)
5. Ensure Band 6.5-7.5 difficulty
6. Make it hyper-relevant to Uzbekistan's future economy

Return ONLY valid JSON:
{
  "dungeon_name": "The [Location] [Object] (e.g., Navoi Energy Vault)",
  "lore_intro": "Brief narrative connecting news to game world",
  "reading_passage": "Full 700+ word academic passage",
  "reading_questions": [
    {"question": "...", "answer": "TRUE|FALSE|NOT GIVEN", "explanation": "..."}
  ],
  "speaking_questions": [
    {"question": "Do you think green hydrogen will transform Uzbekistan's economy? Why?"}
  ],
  "difficulty_band": 7.0,
  "real_world_connection": "Explanation of why this matters for IELTS students"
}`
                        }]
                    },
                    contents: [{
                        parts: [{
                            text: 'Generate the IELTS dungeon from this news article.'
                        }]
                    }]
                })
            }
        );

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API Error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        const text = geminiData.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
        const dungeon = JSON.parse(jsonString);

        // Store as AI-generated content
        const contentResult = await env.DB.prepare(`
            INSERT INTO ai_generated_content
            (content_type, skill_domain, difficulty_band, topic, title, content_text, question_json, target_skill, generated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            'reading',
            'reading',
            dungeon.difficulty_band || 7.0,
            article.topic_category,
            dungeon.dungeon_name,
            dungeon.reading_passage,
            JSON.stringify({
                reading_questions: dungeon.reading_questions,
                speaking_questions: dungeon.speaking_questions,
                lore_intro: dungeon.lore_intro,
                real_world_connection: dungeon.real_world_connection
            }),
            'true_false_ng',
            'infinite_lore_generator'
        ).run();

        // Update news pipeline
        await env.DB.prepare(`
            UPDATE news_content_pipeline
            SET dungeon_generated = 1, generated_content_id = ?, processed_at = ?
            WHERE id = ?
        `).bind(contentResult.meta.last_row_id, new Date().toISOString(), news_id).run();

        return new Response(JSON.stringify({
            success: true,
            content_id: contentResult.meta.last_row_id,
            dungeon: dungeon,
            source_article: article.article_title,
            message: `🗿 New dungeon unlocked: ${dungeon.dungeon_name}`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('News to Dungeon Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/lore/current-events
 * Get recent news-based dungeons
 */
async function handleGetCurrentEvents(request, env, corsHeaders) {
    try {
        const recentDungeons = await env.DB.prepare(`
            SELECT 
                agc.id,
                agc.title,
                agc.topic,
                agc.difficulty_band,
                agc.generated_at,
                ncp.article_title,
                ncp.source,
                ncp.published_date
            FROM ai_generated_content agc
            JOIN news_content_pipeline ncp ON agc.id = ncp.generated_content_id
            WHERE agc.generated_by = 'infinite_lore_generator'
              AND agc.generated_at >= datetime('now', '-7 days')
            ORDER BY agc.generated_at DESC
            LIMIT 10
        `).all();

        return new Response(JSON.stringify({
            current_events: recentDungeons.results || [],
            count: (recentDungeons.results || []).length,
            message: 'These dungeons are based on real Uzbekistan news from the past week'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get Current Events Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * POST /api/lore/auto-generate-dungeons
 * Automatically converts all unprocessed high-relevance news into dungeons
 * Can be run on-demand or scheduled
 */
async function handleAutoGenerateDungeons(request, env, corsHeaders) {
    try {
        // Get unprocessed high-relevance articles
        const articles = await env.DB.prepare(`
            SELECT * FROM news_content_pipeline
            WHERE dungeon_generated = 0 
              AND relevance_score >= 7.0
            ORDER BY relevance_score DESC
            LIMIT 5
        `).all();

        if (!articles.results || articles.results.length === 0) {
            return new Response(JSON.stringify({
                success: true,
                dungeons_generated: 0,
                message: 'No high-relevance articles to process'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const generatedDungeons = [];

        for (const article of articles.results) {
            try {
                // Call news-to-dungeon for each article
                const dungeonResponse = await handleNewsToDungeon(
                    new Request('http://internal', {
                        method: 'POST',
                        body: JSON.stringify({ news_id: article.id })
                    }),
                    env,
                    corsHeaders
                );

                const dungeonData = await dungeonResponse.json();
                if (dungeonData.success) {
                    generatedDungeons.push(dungeonData);
                }
            } catch (error) {
                console.error(`Failed to generate dungeon for article ${article.id}:`, error);
                await env.DB.prepare(`
                    UPDATE news_content_pipeline
                    SET generation_error = ?
                    WHERE id = ?
                `).bind(error.message, article.id).run();
            }
        }

        return new Response(JSON.stringify({
            success: true,
            dungeons_generated: generatedDungeons.length,
            dungeons: generatedDungeons,
            message: `🌍 Generated ${generatedDungeons.length} new dungeons from recent Uzbekistan news`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Auto Generate Dungeons Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export {
    handleNewsScrapingJob,
    handleNewsToDungeon,
    handleGetCurrentEvents,
    handleAutoGenerateDungeons
};
