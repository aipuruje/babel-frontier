// ========== AUTO-EVENT GENERATOR ==========
// Brain Evolution Step 6: Regional Patch & Daily National Challenge System

/**
 * POST /api/auto-forge/regional-quest
 * Auto-generates a culturally customized regional quest targeting a detected weakness
 */
async function handleRegionalQuestGeneration(request, env, corsHeaders) {
    try {
        const { weakness_id, region, skill_domain, criteria } = await request.json();

        // Get weakness details
        const weakness = await env.DB.prepare(`
            SELECT * FROM linguistic_weakness_detection
            WHERE id = ?
        `).bind(weakness_id).first();

        if (!weakness) {
            return new Response(JSON.stringify({ error: 'Weakness not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Cultural landmarks by region
        const landmarkMap = {
            'Fergana': 'Gates of Kokand',
            'Samarkand': 'Registan Square',
            'Tashkent': 'Amir Timur Monument',
            'Bukhara': 'Ark Fortress',
            'Namangan': 'Mulla Kyrgyz Shrine',
            'Andijan': 'Babur Park',
            'Urgench': 'Kalta Minor Minaret'
        };

        const landmark = landmarkMap[region] || 'Ancient Silk Road Tower';

        // Generate quest using Gemini AI
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{
                            text: `You are the Architect of Regional Educational Interventions for Babel Frontier.

Generate a 24-hour regional event for ${region} targeting a detected linguistic weakness.

Weakness Details:
- Skill Domain: ${weakness.skill_domain}
- Criteria: ${weakness.criteria}
- Severity: ${weakness.weakness_severity} (deviation from national average)
- Affected Users: ${weakness.affected_user_count}

Cultural Context:
- Region: ${region}
- Local Landmark: ${landmark}

Mission Requirements:
1. Title must incorporate the local landmark as the quest setting
2. Content must target the specific weakness (e.g., if Listening Section 4, include Australian/American accent audio descriptions)
3. Difficulty should be Band 6.0-7.0 to bridge the gap
4. Gamification: Use regional pride as motivation ("Defend ${region}'s honor!")
5. Include IELTS-aligned questions/tasks

Return ONLY valid JSON in this format:
{
  "title": "The Siege of [Landmark]",
  "title_uz": "Uzbek translation",
  "description": "Lore-rich description connecting landmark to skill mission",
  "mission_type": "listening" | "reading" | "speaking" | "writing",
  "difficulty_band": 6.5,
  "cultural_context": {
    "landmark": "${landmark}",
    "regional_flavor": "Brief Uzbek cultural element"
  },
  "content": {
    "task_description": "What the user must do",
    "questions": [
      {"question": "...", "answer": "...", "band_level": 6.5}
    ]
  }
}`
                        }]
                    },
                    contents: [{
                        parts: [{
                            text: `Generate the regional quest for ${region} targeting ${weakness.skill_domain} (${weakness.criteria}).`
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
        const quest = JSON.parse(jsonString);

        // Calculate event timing (24-hour window)
        const activeFrom = new Date();
        const activeUntil = new Date(activeFrom.getTime() + 24 * 60 * 60 * 1000);

        // Store the auto-generated event
        const result = await env.DB.prepare(`
            INSERT INTO auto_generated_regional_events
            (weakness_id, event_type, title, title_uz, target_region, target_skill, target_criteria, 
             local_landmark, cultural_context, mission_content, difficulty_band, active_from, active_until, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            weakness_id,
            'regional_quest',
            quest.title,
            quest.title_uz || quest.title,
            region,
            weakness.skill_domain,
            weakness.criteria,
            landmark,
            JSON.stringify(quest.cultural_context),
            JSON.stringify(quest.content),
            quest.difficulty_band || 6.0,
            activeFrom.toISOString(),
            activeUntil.toISOString(),
            'active'
        ).run();

        // Mark weakness as intervention_active
        await env.DB.prepare(`
            UPDATE linguistic_weakness_detection
            SET status = 'intervention_active'
            WHERE id = ?
        `).bind(weakness_id).run();

        // Notify users in the region
        const usersInRegion = await env.DB.prepare(`
            SELECT user_id FROM user_locations WHERE region = ?
        `).bind(region).all();

        for (const user of usersInRegion.results || []) {
            await env.DB.prepare(`
                INSERT INTO notifications (user_id, notification_type, title, message, action_url)
                VALUES (?, ?, ?, ?, ?)
            `).bind(
                user.user_id,
                'regional_event',
                `🚨 New Regional Challenge: ${quest.title}`,
                `${region} needs your help! Master ${weakness.skill_domain} and defend our honor.`,
                `/regional-events/${result.meta.last_row_id}`
            ).run();
        }

        return new Response(JSON.stringify({
            success: true,
            event_id: result.meta.last_row_id,
            event: quest,
            active_until: activeUntil.toISOString(),
            notifications_sent: (usersInRegion.results || []).length,
            message: `Regional Quest deployed to ${region}! ${(usersInRegion.results || []).length} users notified.`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Regional Quest Generation Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * POST /api/auto-forge/daily-national-challenge
 * Generates the 4AM daily national challenge targeting top 3 weaknesses
 * Scheduled via Cloudflare Cron
 */
async function handleDailyNationalChallenge(request, env, corsHeaders) {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        // Check if today's challenge already exists
        const existing = await env.DB.prepare(`
            SELECT id FROM daily_national_challenges WHERE challenge_date = ?
        `).bind(todayStr).first();

        if (existing) {
            return new Response(JSON.stringify({
                success: true,
                message: 'Daily challenge already generated for today',
                challenge_id: existing.id
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get yesterday's top 3 weaknesses from national data
        const yesterdayWeaknesses = await env.DB.prepare(`
            SELECT skill_domain, criteria, weakness_severity, affected_user_count
            FROM linguistic_weakness_detection
            WHERE status IN ('detected', 'intervention_active')
              AND detected_at >= datetime('now', '-48 hours')
            ORDER BY weakness_severity DESC, affected_user_count DESC
            LIMIT 3
        `).all();

        if (!yesterdayWeaknesses.results || yesterdayWeaknesses.results.length === 0) {
            // No weaknesses detected - create a general challenge
            const generalChallenge = {
                weakness_1: 'speaking_fluency',
                weakness_2: 'writing_coherence',
                weakness_3: 'listening_section_4'
            };

            await env.DB.prepare(`
                INSERT INTO daily_national_challenges
                (challenge_date, top_weakness_1, top_weakness_2, top_weakness_3, 
                 weakness_analysis, title, description, goal_metric, goal_target, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                todayStr,
                generalChallenge.weakness_1,
                generalChallenge.weakness_2,
                generalChallenge.weakness_3,
                'No specific weaknesses detected. Maintaining general skill development.',
                'National Unity Challenge',
                'Today, all of Uzbekistan trains together. Master all IELTS skills!',
                'total_completions',
                10000,
                'active'
            ).run();

            return new Response(JSON.stringify({
                success: true,
                message: 'General daily challenge created',
                weaknesses: generalChallenge
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const weaknesses = yesterdayWeaknesses.results;
        const weakness1 = weaknesses[0];
        const weakness2 = weaknesses[1] || weakness1;
        const weakness3 = weaknesses[2] || weakness1;

        // Generate challenge using Gemini
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{
                            text: `You are the National Challenge Architect for Babel Frontier.

Generate today's Daily National Challenge based on detected linguistic weaknesses across Uzbekistan.

Yesterday's Top 3 Weaknesses:
1. ${weakness1.skill_domain} (${weakness1.criteria}) - Severity: ${weakness1.weakness_severity}
2. ${weakness2.skill_domain} (${weakness2.criteria}) - Severity: ${weakness2.weakness_severity}
3. ${weakness3.skill_domain} (${weakness3.criteria}) - Severity: ${weakness3.weakness_severity}

Generate a unified challenge that addresses all three weaknesses.

Requirements:
- Title must inspire national unity and collective action
- Description should explain why these weaknesses matter for Uzbekistan's economic future
- Goal should be ambitious but achievable (e.g., "50,000 completions today")
- Reward should be a collective achievement (e.g., "Nation-Wide Mastery Badge")

Return ONLY valid JSON:
{
  "title": "Engaging title",
  "title_uz": "Uzbek translation",
  "description": "Motivational description connecting to national goals",
  "weakness_analysis": "Brief explanation of why these 3 weaknesses are important",
  "goal_metric": "total_completions",
  "goal_target": 50000,
  "reward_description": "What everyone gets when goal is reached",
  "reward_badge_name": "Badge name"
}`
                        }]
                    },
                    contents: [{
                        parts: [{
                            text: 'Generate today\'s daily national challenge.'
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
        const challenge = JSON.parse(jsonString);

        // Auto-generate 3 missions (one per weakness)
        const missionIds = [];
        for (const weakness of [weakness1, weakness2, weakness3]) {
            const missionResult = await env.DB.prepare(`
                INSERT INTO ai_generated_content
                (content_type, skill_domain, difficulty_band, topic, title, content_text, target_skill, generated_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                weakness.skill_domain,
                weakness.skill_domain,
                6.5,
                `Daily Challenge: ${weakness.criteria}`,
                `Weakness Elimination: ${weakness.criteria}`,
                `Auto-generated mission targeting ${weakness.criteria}`,
                weakness.criteria,
                'daily_challenge_auto_forge'
            ).run();

            missionIds.push(missionResult.meta.last_row_id);
        }

        // Insert daily challenge
        const expiresAt = new Date();
        expiresAt.setHours(23, 59, 59, 999);

        const result = await env.DB.prepare(`
            INSERT INTO daily_national_challenges
            (challenge_date, top_weakness_1, top_weakness_2, top_weakness_3, weakness_analysis,
             title, title_uz, description, mission_ids, goal_metric, goal_target, 
             reward_description, reward_badge_name, status, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            todayStr,
            `${weakness1.skill_domain}_${weakness1.criteria}`,
            `${weakness2.skill_domain}_${weakness2.criteria}`,
            `${weakness3.skill_domain}_${weakness3.criteria}`,
            challenge.weakness_analysis,
            challenge.title,
            challenge.title_uz || challenge.title,
            challenge.description,
            JSON.stringify(missionIds),
            challenge.goal_metric,
            challenge.goal_target,
            challenge.reward_description,
            challenge.reward_badge_name,
            'active',
            expiresAt.toISOString()
        ).run();

        return new Response(JSON.stringify({
            success: true,
            challenge_id: result.meta.last_row_id,
            challenge: challenge,
            weaknesses_addressed: 3,
            missions_generated: missionIds.length,
            expires_at: expiresAt.toISOString(),
            message: `🌅 Daily National Challenge deployed for ${todayStr}!`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Daily National Challenge Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/auto-forge/active-regional-events/:user_id
 * Get user's regional events based on their location
 */
async function handleGetActiveRegionalEvents(request, env, corsHeaders, userId) {
    try {
        // Get user's region
        const userLocation = await env.DB.prepare(`
            SELECT region FROM user_locations WHERE user_id = ?
        `).bind(userId).first();

        if (!userLocation) {
            return new Response(JSON.stringify({
                user_id: userId,
                events: [],
                message: 'User location not set'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get active events for user's region
        const events = await env.DB.prepare(`
            SELECT * FROM auto_generated_regional_events
            WHERE target_region = ? 
              AND status = 'active'
              AND active_until > datetime('now')
            ORDER BY active_from DESC
            LIMIT 5
        `).bind(userLocation.region).all();

        return new Response(JSON.stringify({
            user_id: userId,
            region: userLocation.region,
            events: events.results || [],
            count: (events.results || []).length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get Active Regional Events Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/auto-forge/daily-challenge
 * Get today's active daily national challenge
 */
async function handleGetDailyChallenge(request, env, corsHeaders) {
    try {
        const todayStr = new Date().toISOString().split('T')[0];

        const challenge = await env.DB.prepare(`
            SELECT * FROM daily_national_challenges
            WHERE challenge_date = ? AND status = 'active'
        `).bind(todayStr).first();

        if (!challenge) {
            return new Response(JSON.stringify({
                today: todayStr,
                challenge: null,
                message: 'No active challenge for today'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            today: todayStr,
            challenge: challenge
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get Daily Challenge Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export {
    handleRegionalQuestGeneration,
    handleDailyNationalChallenge,
    handleGetActiveRegionalEvents,
    handleGetDailyChallenge
};
