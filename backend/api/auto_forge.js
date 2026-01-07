// ========== CONTENT-TO-COMBAT CONVERTER: AUTO-FORGE ==========

/**
 * CULLEN CHECKSUM: Pedagogical Quality Validator
 * Ensures all auto-generated missions meet IELTS validity standards
 */
async function validateWithCullenChecksum(missionData, env, teachingPoint) {
    try {
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{
                        text: `You are the Cullen Checksum Auditor. Validate this IELTS mission against pedagogical standards.

VALIDATION RULES:
1. Template Detection: Can this mission be solved using memorized templates? (REJECT if yes)
2. Lexical Range: Does it require Band 7+ vocabulary OR does it accept "flowery language"? (REJECT flowery)
3. IELTS Validity: Does this target a REAL IELTS skill or just "fake English"? (REJECT if fake)
4. Band Calibration: Is the difficulty appropriate for the stated band level? (REJECT if mismatch)

Return ONLY this JSON:
{
  "template_detection_passed": true/false,
  "lexical_range_passed": true/false,
  "ielts_validity_passed": true/false,
  "band_calibration_passed": true/false,
  "cullen_checksum_passed": true/false,
  "rejection_reason": "Detailed reason if failed"
}

No markdown, no explanation.`
                    }]
                },
                contents: [{
                    parts: [{
                        text: `Mission to Validate:\n${JSON.stringify(missionData, null, 2)}\n\nTeaching Context:\n${JSON.stringify(teachingPoint, null, 2)}\n\nValidate this mission.`
                    }]
                }]
            })
        });

        if (!geminiResponse.ok) {
            console.error('Cullen Checksum API Error:', geminiResponse.statusText);
            return { cullen_checksum_passed: false, rejection_reason: 'Validation service unavailable' };
        }

        const geminiData = await geminiResponse.json();
        const text = geminiData.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
        const validationResult = JSON.parse(jsonString);

        return validationResult;

    } catch (error) {
        console.error('Cullen Checksum Error:', error);
        return { cullen_checksum_passed: false, rejection_reason: error.message };
    }
}

async function handleAutoForge(request, env, corsHeaders) {
    try {
        const { user_id } = await request.json();

        if (!user_id) {
            return new Response(JSON.stringify({ error: 'user_id required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 1. Query user's top 3 weakness patterns (most frequent mistakes)
        const userWeaknesses = await env.DB.prepare(`
            SELECT error_type, COUNT(*) as frequency 
            FROM mistakes 
            WHERE user_id = ? 
            GROUP BY error_type 
            ORDER BY frequency DESC 
            LIMIT 3
        `).bind(user_id).all();

        if (!userWeaknesses.results || userWeaknesses.results.length === 0) {
            return new Response(JSON.stringify({
                message: 'No user weaknesses found yet. Complete more speaking/writing tasks first.',
                missions_generated: 0
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 2. Match weaknesses with teaching points from Cullen PDFs
        const weaknessTypes = userWeaknesses.results.map(w => w.error_type);

        // Build dynamic query for matching teaching points
        const placeholders = weaknessTypes.map(() => '?').join(',');
        const teachingPoints = await env.DB.prepare(`
            SELECT * FROM pdf_teaching_points 
            WHERE feature_type IN (${placeholders})
            ORDER BY band_requirement DESC
            LIMIT 5
        `).bind(...weaknessTypes).all();

        if (!teachingPoints.results || teachingPoints.results.length === 0) {
            return new Response(JSON.stringify({
                message: 'No teaching points found for user weaknesses. Upload Cullen PDFs first.',
                weaknesses: userWeaknesses.results,
                missions_generated: 0
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Generate missions via Gemini for each matched teaching point
        const generatedMissions = [];

        for (const point of teachingPoints.results.slice(0, 3)) { // Limit to 3 to avoid rate limits
            try {
                let missionData = null;
                let validationResult = null;
                let regenerationCount = 0;
                const maxAttempts = 3;

                // Regeneration loop with Cullen Checksum
                while (regenerationCount < maxAttempts) {
                    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            system_instruction: {
                                parts: [{
                                    text: `You are the Cullen Neural Core. Generate a gamified IELTS mission based on teaching points. 

CRITICAL RULES:
- Mission must NOT be solvable with memorized templates
- Require genuine language control, not flowery language
- Target REAL IELTS skills (not academic pretension)
- Difficulty must match the band requirement

${regenerationCount > 0 ? `PREVIOUS REJECTION: This is attempt ${regenerationCount + 1}. Fix the issues that caused rejection.` : ''}`
                                }]
                            },
                            contents: [{
                                parts: [{
                                    text: `User Weakness: ${point.feature_type} (${point.feature_name})
Common Mistake: ${point.common_mistake}
Teaching Example: ${point.teaching_example}
Band Requirement: ${point.band_requirement}

Generate a JSON mission object:
{
  "title": "Mission title (max 50 chars)",
  "type": "grammar_boss" | "vocab_quest" | "pronunciation_duel",
  "difficulty": "Band X.X",
  "objective": "What the user must do",
  "boss_name": "Creative boss name related to the weakness",
  "mechanic": "How to defeat the boss (e.g., 'Use despite + noun correctly 3 times')",
  "dialogue": "Boss taunt or NPC dialogue (max 100 chars)",
  "win_condition": "Specific success criteria",
  "cullen_checksum_passed": true
}

Return ONLY valid JSON, no markdown.`
                                }]
                            }]
                        })
                    });

                    if (!geminiResponse.ok) {
                        console.error(`Gemini error for ${point.feature_name}: ${geminiResponse.statusText}`);
                        break;
                    }

                    const geminiData = await geminiResponse.json();
                    const text = geminiData.candidates[0].content.parts[0].text;
                    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
                    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
                    missionData = JSON.parse(jsonString);

                    // Validate with Cullen Checksum
                    validationResult = await validateWithCullenChecksum(missionData, env, point);

                    if (validationResult.cullen_checksum_passed) {
                        break; // Mission passed, exit loop
                    }

                    regenerationCount++;
                    console.log(`Mission failed Cullen Checksum (attempt ${regenerationCount}): ${validationResult.rejection_reason}`);
                }

                // Log audit trail
                let missionId = null;
                if (missionData && validationResult.cullen_checksum_passed) {
                    // Save mission only if it passed
                    const saveResult = await env.DB.prepare(`
                        INSERT INTO user_weakness_missions 
                        (user_id, weakness_pattern, mission_title, mission_type, mission_content, difficulty, triggered_by, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                        user_id,
                        point.feature_type,
                        missionData.title,
                        missionData.type || 'grammar_boss',
                        JSON.stringify(missionData),
                        missionData.difficulty || `Band ${point.band_requirement}`,
                        'pdf_analysis',
                        new Date().toISOString()
                    ).run();

                    missionId = saveResult.meta.last_row_id;
                }

                // Log Cullen audit
                await env.DB.prepare(`
                    INSERT INTO cullen_audit_log
                    (mission_id, mission_type, template_detection_passed, lexical_range_passed, 
                     ielts_validity_passed, band_calibration_passed, cullen_checksum_passed,
                     rejection_reason, regeneration_count, generated_by_model, audited_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    missionId,
                    'user_weakness_mission',
                    validationResult.template_detection_passed ? 1 : 0,
                    validationResult.lexical_range_passed ? 1 : 0,
                    validationResult.ielts_validity_passed ? 1 : 0,
                    validationResult.band_calibration_passed ? 1 : 0,
                    validationResult.cullen_checksum_passed ? 1 : 0,
                    validationResult.rejection_reason || null,
                    regenerationCount,
                    'gemini-2.0-flash-exp',
                    new Date().toISOString()
                ).run();

                if (validationResult.cullen_checksum_passed) {
                    generatedMissions.push({
                        weakness: point.feature_name,
                        mission_title: missionData.title,
                        type: missionData.type
                    });
                }

            } catch (e) {
                console.error(`Mission generation error for ${point.feature_name}:`, e.message);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            user_id: user_id,
            weaknesses_analyzed: userWeaknesses.results.length,
            teaching_points_matched: teachingPoints.results.length,
            missions_generated: generatedMissions.length,
            missions: generatedMissions,
            message: `Generated ${generatedMissions.length} personalized missions targeting your weaknesses!`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Auto-forge error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
