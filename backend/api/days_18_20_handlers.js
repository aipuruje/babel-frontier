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
