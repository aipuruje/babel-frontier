// ========== SULTAN'S API (B2G/B2B INTELLIGENCE) ==========
// Brain Evolution Step 6: Institutional Partner API with Zero-Knowledge Privacy

/**
 * POST /api/sultan/partner/register
 * Registers a new institutional partner (government, university, NGO)
 */
async function handleRegisterPartner(request, env, corsHeaders) {
    try {
        const { partner_type, organization_name, contact_email, contact_phone, access_tier } = await request.json();

        if (!partner_type || !organization_name) {
            return new Response(JSON.stringify({ error: 'partner_type and organization_name required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Generate secure API key
        const apiKey = `sk_${partner_type}_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;

        // Define access scopes based on partner type
        const scopeMap = {
            government: ['literacy_heatmap', 'weakness_stream', 'velocity_metrics'],
            university: ['elite_profiles', 'performance_trends'],
            ngo: ['regional_insights'],
            corporate: ['talent_pipeline']
        };

        const scopes = scopeMap[partner_type] || ['basic'];

        // Subscription plans
        const planMap = {
            government: 'annual_5000',
            university: 'monthly_500',
            ngo: 'free',
            corporate: 'monthly_500'
        };

        const subscriptionPlan = planMap[partner_type] || 'free';
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year from now

        const result = await env.DB.prepare(`
            INSERT INTO institutional_partners
            (partner_type, organization_name, contact_email, contact_phone, api_key, 
             access_tier, access_scopes, subscription_plan, subscription_expires)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            partner_type,
            organization_name,
            contact_email || null,
            contact_phone || null,
            apiKey,
            access_tier || 'basic',
            JSON.stringify(scopes),
            subscriptionPlan,
            expiresAt.toISOString()
        ).run();

        return new Response(JSON.stringify({
            success: true,
            partner_id: result.meta.last_row_id,
            api_key: apiKey,
            access_scopes: scopes,
            subscription_plan: subscriptionPlan,
            expires_at: expiresAt.toISOString(),
            message: `Partner registered successfully. API key is: ${apiKey}`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Register Partner Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * Middleware: Verify API key and permissions
 */
async function verifyPartnerApiKey(apiKey, requiredScope, env) {
    const partner = await env.DB.prepare(`
        SELECT * FROM institutional_partners
        WHERE api_key = ? AND status = 'active'
    `).bind(apiKey).first();

    if (!partner) {
        return { valid: false, error: 'Invalid or inactive API key' };
    }

    // Check subscription expiry
    if (new Date(partner.subscription_expires) < new Date()) {
        return { valid: false, error: 'Subscription expired' };
    }

    // Check scope access
    const scopes = JSON.parse(partner.access_scopes || '[]');
    if (requiredScope && !scopes.includes(requiredScope)) {
        return { valid: false, error: `Access denied. Required scope: ${requiredScope}` };
    }

    // Log API access
    await env.DB.prepare(`
        INSERT INTO partner_api_logs (partner_id, endpoint, method)
        VALUES (?, ?, ?)
    `).bind(partner.id, requiredScope || 'unknown', 'GET').run();

    // Increment API call count
    await env.DB.prepare(`
        UPDATE institutional_partners
        SET api_calls_this_month = api_calls_this_month + 1, last_access = ?
        WHERE id = ?
    `).bind(new Date().toISOString(), partner.id).run();

    return { valid: true, partner };
}

/**
 * GET /api/sultan/government/literacy-heatmap
 * Government-only: National literacy performance heatmap (anonymized)
 */
async function handleGovernmentLiteracyHeatmap(request, env, corsHeaders, apiKey) {
    try {
        const authResult = await verifyPartnerApiKey(apiKey, 'literacy_heatmap', env);
        if (!authResult.valid) {
            return new Response(JSON.stringify({ error: authResult.error }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get anonymized regional performance data
        const heatmap = await env.DB.prepare(`
            SELECT 
                region,
                skill_domain,
                avg_band,
                deviation_from_national,
                user_count,
                last_aggregated
            FROM regional_performance_clusters
            WHERE user_count >= 10
            ORDER BY region, skill_domain
        `).all();

        // Group by region
        const regions = {};
        for (const row of heatmap.results || []) {
            if (!regions[row.region]) {
                regions[row.region] = {
                    region: row.region,
                    total_users: row.user_count,
                    skills: {},
                    overall_status: 'healthy'
                };
            }

            regions[row.region].skills[row.skill_domain] = {
                avg_band: parseFloat(row.avg_band.toFixed(2)),
                deviation: parseFloat(row.deviation_from_national.toFixed(2)),
                status: row.deviation_from_national < -0.5 ? 'needs_intervention' : 'healthy'
            };

            // Determine overall regional status
            if (row.deviation_from_national < -0.5) {
                regions[row.region].overall_status = 'needs_intervention';
            }
        }

        // Get national velocity metrics
        const velocity = await env.DB.prepare(`
            SELECT * FROM national_mastery_velocity
            ORDER BY measurement_date DESC
            LIMIT 1
        `).first();

        return new Response(JSON.stringify({
            heatmap: Object.values(regions),
            national_metrics: {
                avg_overall_band: velocity?.avg_overall_band,
                band_velocity: velocity?.band_velocity,
                economic_opportunity_pct: velocity?.economic_opportunity_percentage,
                alert_active: velocity?.alert_triggered === 1
            },
            generated_at: new Date().toISOString(),
            data_classification: 'ANONYMIZED - No PII included'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Government Literacy Heatmap Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/sultan/university/elite-profiles
 * University-only: High-potential student leads for recruitment
 */
async function handleUniversityEliteProfiles(request, env, corsHeaders, apiKey) {
    try {
        const authResult = await verifyPartnerApiKey(apiKey, 'elite_profiles', env);
        if (!authResult.valid) {
            return new Response(JSON.stringify({ error: authResult.error }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get elite profiles (Band 8.5+, user consent required)
        const profiles = await env.DB.prepare(`
            SELECT 
                id,
                overall_band,
                speaking_band,
                writing_band,
                reading_band,
                listening_band,
                performance_velocity,
                logical_reasoning_score,
                consistency_score,
                region,
                is_rural,
                created_at
            FROM elite_profiles
            WHERE user_consent = 1 
              AND profile_status = 'available'
              AND overall_band >= 8.5
              AND expires_at > datetime('now')
            ORDER BY overall_band DESC, performance_velocity DESC
            LIMIT 50
        `).all();

        // Anonymize profiles (remove user_id, add profile tokens)
        const anonymizedProfiles = (profiles.results || []).map(p => ({
            profile_token: `EP_${p.id}_${Math.random().toString(36).substr(2, 8)}`,
            performance: {
                overall_band: p.overall_band,
                speaking: p.speaking_band,
                writing: p.writing_band,
                reading: p.reading_band,
                listening: p.listening_band
            },
            intelligence_signals: {
                velocity: p.performance_velocity, // Bands improved per week
                logical_reasoning: p.logical_reasoning_score,
                consistency: p.consistency_score
            },
            geographic_context: {
                region: p.region,
                is_rural: p.is_rural === 1,
                diamond_in_rough: p.is_rural === 1 && p.overall_band >= 8.5
            },
            created_at: p.created_at
        }));

        return new Response(JSON.stringify({
            elite_profiles: anonymizedProfiles,
            count: anonymizedProfiles.length,
            placement_fee_per_profile: 500000, // UZS
            data_classification: 'ANONYMIZED - User consent obtained',
            instructions: 'Use profile_token to claim a profile via POST /api/sultan/university/claim-profile'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('University Elite Profiles Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * POST /api/sultan/university/claim-profile/:profile_id
 * University claims an elite profile for premium placement fee
 */
async function handleClaimProfile(request, env, corsHeaders, apiKey, profileId) {
    try {
        const authResult = await verifyPartnerApiKey(apiKey, 'elite_profiles', env);
        if (!authResult.valid) {
            return new Response(JSON.stringify({ error: authResult.error }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Get profile
        const profile = await env.DB.prepare(`
            SELECT * FROM elite_profiles WHERE id = ? AND profile_status = 'available'
        `).bind(profileId).first();

        if (!profile) {
            return new Response(JSON.stringify({ error: 'Profile not available' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const placementFee = 500000; // UZS

        // Mark profile as claimed
        await env.DB.prepare(`
            UPDATE elite_profiles
            SET profile_status = 'claimed', 
                claimed_by_partner_id = ?,
                claimed_at = ?,
                placement_fee_uzs = ?
            WHERE id = ?
        `).bind(authResult.partner.id, new Date().toISOString(), placementFee, profileId).run();

        // Update partner revenue
        await env.DB.prepare(`
            UPDATE institutional_partners
            SET total_revenue_uzs = total_revenue_uzs + ?
            WHERE id = ?
        `).bind(placementFee, authResult.partner.id).run();

        // Return full profile details to the claiming university
        return new Response(JSON.stringify({
            success: true,
            profile_id: profileId,
            user_id: profile.user_id, // Now revealed after claiming
            performance: {
                overall_band: profile.overall_band,
                speaking: profile.speaking_band,
                writing: profile.writing_band,
                reading: profile.reading_band,
                listening: profile.listening_band
            },
            placement_fee_uzs: placementFee,
            claimed_by: authResult.partner.organization_name,
            message: `Profile claimed successfully. Placement fee: ${placementFee} UZS`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Claim Profile Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

/**
 * GET /api/sultan/weakness-stream
 * Real-time weakness detection stream for partners
 */
async function handleWeaknessStream(request, env, corsHeaders, apiKey) {
    try {
        const authResult = await verifyPartnerApiKey(apiKey, 'weakness_stream', env);
        if (!authResult.valid) {
            return new Response(JSON.stringify({ error: authResult.error }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const weaknesses = await env.DB.prepare(`
            SELECT 
                region,
                skill_domain,
                criteria,
                weakness_severity,
                affected_user_count,
                pattern_description,
                status,
                detected_at
            FROM linguistic_weakness_detection
            WHERE status IN ('detected', 'intervention_active')
              AND detected_at >= datetime('now', '-7 days')
            ORDER BY weakness_severity DESC, affected_user_count DESC
            LIMIT 20
        `).all();

        return new Response(JSON.stringify({
            weaknesses: weaknesses.results || [],
            count: (weaknesses.results || []).length,
            generated_at: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Weakness Stream Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

export {
    handleRegisterPartner,
    handleGovernmentLiteracyHeatmap,
    handleUniversityEliteProfiles,
    handleClaimProfile,
    handleWeaknessStream
};
