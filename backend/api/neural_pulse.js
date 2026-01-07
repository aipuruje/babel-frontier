// ========== NEURAL PULSE REPORTER ==========
// Brain Evolution Step 4: Passive-to-Active Analytics

/**
 * GET /api/neural-pulse/weekly-report/:user_id
 * Individual passive-to-active conversion metrics
 */
async function handleWeeklyUserReport(request, env, corsHeaders, userId) {
    try {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Get phrases captured vs activated
        const bufferStats = await env.DB.prepare(`
            SELECT 
                COUNT(*) as total_captured,
                SUM(CASE WHEN activated = 1 THEN 1 ELSE 0 END) as total_activated,
                AVG(CASE WHEN activated = 1 
                    THEN (julianday(activated_at) - julianday(captured_at)) * 24 
                    ELSE NULL END) as avg_hours_to_activation
            FROM active_memory_buffer
            WHERE user_id = ? AND captured_at > ?
        `).bind(userId, oneWeekAgo).first();

        // Get phrase types activated
        const phraseBreakdown = await env.DB.prepare(`
            SELECT phrase_type, COUNT(*) as count
            FROM active_memory_buffer
            WHERE user_id = ? AND activated = 1 AND captured_at > ?
            GROUP BY phrase_type
        `).bind(userId, oneWeekAgo).all();

        // Get cognitive load trends
        const cognitiveLoadTrend = await env.DB.prepare(`
            SELECT 
                DATE(recorded_at) as day,
                AVG (hesitation_index) as avg_hesitation
            FROM cognitive_load_metrics
            WHERE user_id = ? AND recorded_at > ?
            GROUP BY DATE(recorded_at)
            ORDER BY day
        `).bind(userId, oneWeekAgo).all();

        // Get scaffold usage
        const scaffoldUsage = await env.DB.prepare(`
            SELECT 
                COUNT(*) as total_interventions,
                SUM(CASE WHEN user_completed_mission = 1 THEN 1 ELSE 0 END) as successful_with_scaffold
            FROM scaffold_interventions
            WHERE user_id = ? AND created_at > ?
        `).bind(userId, oneWeekAgo).first();

        // Get current autonomy score
        const autonomy = await env.DB.prepare(`
            SELECT autonomy_score, sentence_starter_visibility, word_bank_visibility
            FROM user_scaffold_progress
            WHERE user_id = ?
        `).bind(userId).first();

        const activationRate = bufferStats.total_captured > 0
            ? (bufferStats.total_activated / bufferStats.total_captured * 100).toFixed(1)
            : 0;

        return new Response(JSON.stringify({
            user_id: userId,
            report_period: '7 days',
            passive_to_active: {
                phrases_captured: bufferStats.total_captured || 0,
                phrases_activated: bufferStats.total_activated || 0,
                activation_rate_percent: parseFloat(activationRate),
                avg_time_to_activation_hours: bufferStats.avg_hours_to_activation?.toFixed(2) || null
            },
            phrase_mastery: {
                by_type: phraseBreakdown.results || []
            },
            cognitive_performance: {
                weekly_trend: cognitiveLoadTrend.results || [],
                avg_hesitation_index: cognitiveLoadTrend.results?.length > 0
                    ? (cognitiveLoadTrend.results.reduce((sum, day) => sum + day.avg_hesitation, 0) / cognitiveLoadTrend.results.length).toFixed(2)
                    : null
            },
            scaffolding: {
                total_interventions: scaffoldUsage.total_interventions || 0,
                success_rate_percent: scaffoldUsage.total_interventions > 0
                    ? (scaffoldUsage.successful_with_scaffold / scaffoldUsage.total_interventions * 100).toFixed(1)
                    : 0,
                current_autonomy_score: autonomy?.autonomy_score || 0,
                scaffold_visibility: {
                    sentence_starters: autonomy?.sentence_starter_visibility || 1.0,
                    word_bank: autonomy?.word_bank_visibility || 1.0
                }
            },
            insights: generateUserInsights(bufferStats, scaffoldUsage, autonomy)
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Weekly User Report Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/neural-pulse/population-insights
 * Uzbekistan cohort-level analytics
 */
async function handlePopulationInsights(request, env, corsHeaders) {
    try {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        // Total users with neural sync activity
        const activeUsers = await env.DB.prepare(`
            SELECT COUNT(DISTINCT user_id) as count
            FROM active_memory_buffer
            WHERE captured_at > ?
        `).bind(oneWeekAgo).first();

        // Overall activation rate
        const globalActivation = await env.DB.prepare(`
            SELECT 
                COUNT(*) as total_phrases,
                SUM(CASE WHEN activated = 1 THEN 1 ELSE 0 END) as activated_phrases
            FROM active_memory_buffer
            WHERE captured_at > ?
        `).bind(oneWeekAgo).first();

        // Most commonly activated phrases (trending vocabulary)
        const trendingPhrases = await env.DB.prepare(`
            SELECT target_phrase, phrase_type, COUNT(*) as activation_count
            FROM active_memory_buffer
            WHERE activated = 1 AND captured_at > ?
            GROUP BY target_phrase
            ORDER BY activation_count DESC
            LIMIT 10
        `).bind(oneWeekAgo).all();

        // Cullen checksum quality metrics
        const qualityMetrics = await env.DB.prepare(`
            SELECT 
                COUNT(*) as total_missions_generated,
                SUM(CASE WHEN cullen_checksum_passed = 1 THEN 1 ELSE 0 END) as missions_passed,
                AVG(regeneration_count) as avg_regenerations
            FROM cullen_audit_log
            WHERE audited_at > ?
        `).bind(oneWeekAgo).first();

        // Scaffold effectiveness
        const scaffoldMetrics = await env.DB.prepare(`
            SELECT 
                AVG(CASE WHEN user_completed_mission = 1 THEN 1.0 ELSE 0.0 END) as completion_rate
            FROM scaffold_interventions
            WHERE created_at > ?
        `).bind(oneWeekAgo).first();

        const globalActivationRate = globalActivation.total_phrases > 0
            ? (globalActivation.activated_phrases / globalActivation.total_phrases * 100).toFixed(1)
            : 0;

        const checksumPassRate = qualityMetrics.total_missions_generated > 0
            ? (qualityMetrics.missions_passed / qualityMetrics.total_missions_generated * 100).toFixed(1)
            : 0;

        return new Response(JSON.stringify({
            report_period: '7 days',
            population_size: activeUsers.count || 0,
            global_metrics: {
                total_phrases_captured: globalActivation.total_phrases || 0,
                total_phrases_activated: globalActivation.activated_phrases || 0,
                activation_rate_percent: parseFloat(globalActivationRate)
            },
            trending_vocabulary: {
                top_10_phrases: trendingPhrases.results || []
            },
            quality_assurance: {
                missions_generated: qualityMetrics.total_missions_generated || 0,
                cullen_checksum_pass_rate_percent: parseFloat(checksumPassRate),
                avg_regenerations_per_mission: qualityMetrics.avg_regenerations?.toFixed(2) || 0
            },
            scaffolding_effectiveness: {
                mission_completion_rate_with_scaffold_percent: scaffoldMetrics.completion_rate
                    ? (scaffoldMetrics.completion_rate * 100).toFixed(1)
                    : 0
            },
            insights: generatePopulationInsights(globalActivationRate, checksumPassRate)
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Population Insights Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Helper: Generate actionable insights for individual users
 */
function generateUserInsights(bufferStats, scaffoldUsage, autonomy) {
    const insights = [];

    const activationRate = bufferStats.total_captured > 0
        ? (bufferStats.total_activated / bufferStats.total_captured)
        : 0;

    if (activationRate < 0.4) {
        insights.push({
            type: 'warning',
            message: 'Your Golden Thread activation rate is low. Try using Charged Spells within 2 hours of earning them.'
        });
    } else if (activationRate > 0.7) {
        insights.push({
            type: 'success',
            message: '🔥 Excellent! You\'re converting passive knowledge into active skills at an elite level.'
        });
    }

    if (autonomy && autonomy.autonomy_score > 0.8) {
        insights.push({
            type: 'achievement',
            message: '🎓 Nearly autonomous! You\'ve mastered the art of unassisted performance.'
        });
    }

    if (bufferStats.avg_hours_to_activation && bufferStats.avg_hours_to_activation < 2) {
        insights.push({
            type: 'tip',
            message: '⚡ Lightning fast activation! Your brain is building neural pathways rapidly.'
        });
    }

    return insights;
}

/**
 * Helper: Generate insights for population-level trends
 */
function generatePopulationInsights(activationRate, checksumPassRate) {
    const insights = [];

    if (parseFloat(activationRate) > 60) {
        insights.push({
            message: `${activationRate}% global activation rate exceeds industry standards for spaced repetition (40%).`
        });
    }

    if (parseFloat(checksumPassRate) < 80) {
        insights.push({
            message: `Cullen Checksum rejection rate is ${(100 - parseFloat(checksumPassRate)).toFixed(1)}%. Consider refining generation prompts.`
        });
    }

    return insights;
}

export {
    handleWeeklyUserReport,
    handlePopulationInsights
};
