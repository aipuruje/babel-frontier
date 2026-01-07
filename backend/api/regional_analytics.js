// ========== REGIONAL ANALYTICS (HIVE-MIND) ==========
// Brain Evolution Step 6: Collective Intelligence & Regional Weakness Detection

/**
 * POST /api/hive/aggregate
 * Daily aggregation job: Analyzes all user performance data by region
 * Detects linguistic weaknesses at district/regional level
 * Scheduled via Cloudflare Cron (runs at midnight)
 */
async function handleHiveAggregate(request, env, corsHeaders) {
    try {
        const now = new Date().toISOString();
        const regions = ['Tashkent', 'Samarkand', 'Fergana', 'Namangan', 'Bukhara', 'Andijan', 'Urgench'];
        const skillDomains = ['speaking', 'listening', 'reading', 'writing'];
        const criteriaMap = {
            speaking: ['fluency', 'coherence', 'lexical_resource', 'grammar'],
            listening: ['section_1', 'section_2', 'section_3', 'section_4'],
            reading: ['skimming', 'scanning', 'heading_matching', 'true_false_ng'],
            writing: ['task_response', 'coherence', 'lexical_resource', 'grammar']
        };

        const aggregationResults = [];
        const detectedWeaknesses = [];

        // Loop through each region and skill domain
        for (const region of regions) {
            for (const skill of skillDomains) {
                const criteria = criteriaMap[skill] || [skill];

                for (const criterion of criteria) {
                    // Calculate regional average for this skill/criterion
                    const regionalData = await env.DB.prepare(`
                        SELECT 
                            COUNT(DISTINCT u.user_id) as user_count,
                            AVG(ubs.${skill}_band) as avg_band
                        FROM users u
                        JOIN user_brain_state ubs ON u.user_id = ubs.user_id
                        LEFT JOIN user_locations ul ON u.user_id = ul.user_id
                        WHERE ul.region = ? AND ubs.${skill}_band > 0
                    `).bind(region).first();

                    // Calculate national average for comparison
                    const nationalData = await env.DB.prepare(`
                        SELECT AVG(${skill}_band) as national_avg
                        FROM user_brain_state
                        WHERE ${skill}_band > 0
                    `).first();

                    const avgBand = regionalData?.avg_band || 0.0;
                    const nationalAvg = nationalData?.national_avg || 0.0;
                    const deviation = avgBand - nationalAvg;
                    const userCount = regionalData?.user_count || 0;

                    // Insert or update regional performance cluster
                    await env.DB.prepare(`
                        INSERT INTO regional_performance_clusters 
                        (region, skill_domain, criteria, avg_score, avg_band, user_count, national_avg_score, deviation_from_national, last_aggregated)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON CONFLICT(region, skill_domain, criteria) DO UPDATE SET
                            avg_band = excluded.avg_band,
                            user_count = excluded.user_count,
                            national_avg_score = excluded.national_avg_score,
                            deviation_from_national = excluded.deviation_from_national,
                            last_aggregated = excluded.last_aggregated
                    `).bind(region, skill, criterion, avgBand * 10, avgBand, userCount, nationalAvg, deviation, now).run();

                    aggregationResults.push({ region, skill, criterion, avgBand, deviation, userCount });

                    // Detect weakness if deviation is < -10%
                    if (deviation < -0.65 && userCount >= 10) { // Band 6.5 threshold
                        const severity = Math.abs(deviation);

                        // Check if weakness already detected
                        const existing = await env.DB.prepare(`
                            SELECT id FROM linguistic_weakness_detection
                            WHERE region = ? AND skill_domain = ? AND criteria = ? AND status = 'detected'
                        `).bind(region, skill, criterion).first();

                        if (!existing) {
                            const weaknessDescription = `${region} users scoring ${deviation.toFixed(2)} bands below national average in ${skill} (${criterion})`;

                            const result = await env.DB.prepare(`
                                INSERT INTO linguistic_weakness_detection
                                (region, skill_domain, criteria, weakness_severity, affected_user_count, pattern_description, recommended_intervention)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                            `).bind(
                                region,
                                skill,
                                criterion,
                                severity,
                                userCount,
                                weaknessDescription,
                                'regional_event'
                            ).run();

                            detectedWeaknesses.push({
                                id: result.meta.last_row_id,
                                region,
                                skill,
                                criterion,
                                severity,
                                affectedUsers: userCount
                            });
                        }
                    }
                }
            }
        }

        // Update national mastery velocity
        const nationalMetrics = await env.DB.prepare(`
            SELECT 
                COUNT(DISTINCT user_id) as total_users,
                AVG(speaking_band) as avg_speaking,
                AVG(listening_band) as avg_listening,
                AVG(reading_band) as avg_reading,
                AVG(writing_band) as avg_writing,
                AVG((speaking_band + listening_band + reading_band + writing_band) / 4) as avg_overall
            FROM user_brain_state
            WHERE speaking_band > 0 OR listening_band > 0 OR reading_band > 0 OR writing_band > 0
        `).first();

        const avgOverall = nationalMetrics?.avg_overall || 0.0;
        const usersAboveThreshold = await env.DB.prepare(`
            SELECT COUNT(*) as count
            FROM user_brain_state
            WHERE (speaking_band + listening_band + reading_band + writing_band) / 4 >= 6.5
        `).first();

        const economicOpportunityPct = nationalMetrics.total_users > 0
            ? (usersAboveThreshold.count / nationalMetrics.total_users) * 100
            : 0;

        // Calculate velocity (compare to yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const previousVelocity = await env.DB.prepare(`
            SELECT avg_overall_band FROM national_mastery_velocity
            WHERE measurement_date = ?
        `).bind(yesterdayStr).first();

        const bandVelocity = previousVelocity
            ? avgOverall - previousVelocity.avg_overall_band
            : 0.0;

        const todayStr = new Date().toISOString().split('T')[0];

        // Check for stalled progress
        const recentVelocities = await env.DB.prepare(`
            SELECT band_velocity FROM national_mastery_velocity
            WHERE measurement_date >= date('now', '-7 days')
            ORDER BY measurement_date DESC
            LIMIT 7
        `).all();

        let stalledDays = 0;
        for (const v of recentVelocities.results || []) {
            if (v.band_velocity <= 0) stalledDays++;
            else break;
        }

        const alertTriggered = stalledDays >= 2;
        const alertMessage = alertTriggered
            ? `⚠️ National mastery velocity has stalled for ${stalledDays} days. Recommend immediate intervention.`
            : null;

        await env.DB.prepare(`
            INSERT INTO national_mastery_velocity
            (measurement_date, total_active_users, avg_overall_band, avg_speaking_band, avg_listening_band, avg_reading_band, avg_writing_band, 
             band_velocity, users_above_threshold, economic_opportunity_percentage, stalled_days, alert_triggered, alert_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(measurement_date) DO UPDATE SET
                total_active_users = excluded.total_active_users,
                avg_overall_band = excluded.avg_overall_band,
                band_velocity = excluded.band_velocity,
                stalled_days = excluded.stalled_days,
                alert_triggered = excluded.alert_triggered,
                alert_message = excluded.alert_message
        `).bind(
            todayStr,
            nationalMetrics.total_users || 0,
            avgOverall,
            nationalMetrics.avg_speaking || 0,
            nationalMetrics.avg_listening || 0,
            nationalMetrics.avg_reading || 0,
            nationalMetrics.avg_writing || 0,
            bandVelocity,
            usersAboveThreshold.count || 0,
            economicOpportunityPct,
            stalledDays,
            alertTriggered ? 1 : 0,
            alertMessage
        ).run();

        return new Response(JSON.stringify({
            success: true,
            aggregation_date: todayStr,
            regions_processed: regions.length,
            clusters_updated: aggregationResults.length,
            weaknesses_detected: detectedWeaknesses.length,
            weaknesses: detectedWeaknesses,
            national_metrics: {
                total_users: nationalMetrics.total_users,
                avg_overall_band: avgOverall.toFixed(2),
                band_velocity: bandVelocity.toFixed(3),
                economic_opportunity_pct: economicOpportunityPct.toFixed(1),
                stalled_days: stalledDays,
                alert_triggered: alertTriggered
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Hive Aggregate Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/hive/regional-weakness/:region
 * Get current detected weaknesses for a specific region
 */
async function handleGetRegionalWeakness(request, env, corsHeaders, region) {
    try {
        const weaknesses = await env.DB.prepare(`
            SELECT id, skill_domain, criteria, weakness_severity, affected_user_count, 
                   pattern_description, recommended_intervention, status, detected_at
            FROM linguistic_weakness_detection
            WHERE region = ? AND status IN ('detected', 'intervention_active')
            ORDER BY weakness_severity DESC
            LIMIT 10
        `).bind(region).all();

        return new Response(JSON.stringify({
            region,
            weaknesses: weaknesses.results || [],
            count: (weaknesses.results || []).length
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get Regional Weakness Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/hive/national-heatmap
 * Returns regional performance visualization data for government dashboard
 */
async function handleNationalHeatmap(request, env, corsHeaders) {
    try {
        const heatmapData = await env.DB.prepare(`
            SELECT region, skill_domain, avg_band, deviation_from_national, user_count
            FROM regional_performance_clusters
            WHERE user_count > 0
            ORDER BY region, skill_domain
        `).all();

        // Group by region
        const regions = {};
        for (const row of heatmapData.results || []) {
            if (!regions[row.region]) {
                regions[row.region] = {
                    region: row.region,
                    user_count: row.user_count,
                    skills: {}
                };
            }
            regions[row.region].skills[row.skill_domain] = {
                avg_band: row.avg_band,
                deviation: row.deviation_from_national
            };
        }

        return new Response(JSON.stringify({
            heatmap: Object.values(regions),
            generated_at: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('National Heatmap Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/hive/national-velocity
 * Returns national mastery velocity metrics for monitoring
 */
async function handleNationalVelocity(request, env, corsHeaders) {
    try {
        const recent = await env.DB.prepare(`
            SELECT * FROM national_mastery_velocity
            ORDER BY measurement_date DESC
            LIMIT 30
        `).all();

        const latest = recent.results?.[0];

        return new Response(JSON.stringify({
            latest_metrics: latest,
            historical: recent.results || [],
            alert_active: latest?.alert_triggered === 1,
            alert_message: latest?.alert_message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('National Velocity Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export {
    handleHiveAggregate,
    handleGetRegionalWeakness,
    handleNationalHeatmap,
    handleNationalVelocity
};
