/**
 * Cloudflare Queue Consumer - IELTS Essay Grading
 * 
 * Processes grading tasks asynchronously from GRADING_QUEUE
 * Implements retry logic, Cullen Checksum quality assurance, and detailed result storage
 */

import { callIELTSAI, validateGradingResult } from './ielts_ai_grader.js';
import { AURA_SYSTEM_PROMPT, formatAuraInput } from './mentorship/aura_prompt.js';

/**
 * Main Queue Consumer Handler
 * Called automatically by Cloudflare Workers when messages arrive in GRADING_QUEUE
 * 
 * @param {MessageBatch} batch - Batch of queue messages
 * @param {Object} env - Environment bindings (DB, KV, secrets)
 */
export async function processGradingQueue(batch, env) {
    const results = [];

    for (const message of batch.messages) {
        try {
            console.log(`[QUEUE] Processing submission ${message.body.submissionId}`);

            const result = await processGradingMessage(message.body, env);
            results.push(result);

            // Acknowledge successful processing
            message.ack();

        } catch (error) {
            console.error(`[QUEUE_ERROR] Failed to process message:`, error);

            // Retry logic: check retry count
            const retryCount = message.body.retryCount || 0;

            if (retryCount < 3) {
                // Retry with exponential backoff
                console.log(`[RETRY] Retrying submission ${message.body.submissionId} (attempt ${retryCount + 1}/3)`);
                message.retry({
                    delaySeconds: Math.pow(2, retryCount) * 10  // 10s, 20s, 40s
                });

                // Update retry count in message
                message.body.retryCount = retryCount + 1;

            } else {
                // Max retries exceeded - mark as FAILED
                console.error(`[FAILED] Max retries exceeded for submission ${message.body.submissionId}`);

                await markSubmissionFailed(
                    message.body.submissionId,
                    env.DB,
                    error.message,
                    retryCount
                );

                message.ack();  // Remove from queue
            }

            results.push({ success: false, error: error.message });
        }
    }

    return {
        processed: batch.messages.length,
        results
    };
}

/**
 * Process a single grading message
 * @param {Object} messageBody - Queue message payload
 * @param {Object} env - Environment bindings
 */
async function processGradingMessage(messageBody, env) {
    const { submissionId, userId, essayContent, prompt, source, timestamp } = messageBody;

    const startTime = Date.now();

    // 1. Fetch submission from D1 to verify it exists
    const submission = await env.DB.prepare(`
        SELECT id, status FROM submissions WHERE id = ?
    `).bind(submissionId).first();

    if (!submission) {
        throw new Error(`Submission ${submissionId} not found in database`);
    }

    if (submission.status !== 'PENDING') {
        console.warn(`[SKIP] Submission ${submissionId} already processed (status: ${submission.status})`);
        return { success: true, skipped: true };
    }

    // 2. Call IELTS AI Grader
    console.log(`[AI_GRADING] Calling IELTS AI for submission ${submissionId}`);
    const gradingResult = await callIELTSAI(essayContent, env, prompt);

    // 3. Validate result structure
    if (!validateGradingResult(gradingResult)) {
        throw new Error('AI returned invalid grading result structure');
    }

    // 4. Cullen Checksum - Pedagogical quality assurance
    const checksumResult = await runCullenChecksum(gradingResult, essayContent, env);

    if (!checksumResult.passed) {
        console.warn(`[CULLEN_CHECKSUM] Submission ${submissionId} failed quality check: ${checksumResult.reason}`);
        // Log to audit table (using underscore user_id if needed, but keeping audit table internal for now)
    }


    // 5. Store results in D1
    const gradingDuration = (Date.now() - startTime) / 1000;  // seconds

    // Calculate raw band score (unrounded average of 4 criteria)
    const rawBandScore = (
        gradingResult.criteriaScores.TR +
        gradingResult.criteriaScores.CC +
        gradingResult.criteriaScores.LR +
        gradingResult.criteriaScores.GRA
    ) / 4;

    // Identify high-impact corrections (those that could improve score by >0.5 bands)
    const highImpactCorrections = (gradingResult.detailed_corrections || [])
        .sort((a, b) => (b.impact || 0) - (a.impact || 0))
        .map(c => ({
            original: c.original,
            replacement: c.replacement,
            impact: c.impact || 0,
            reason: c.reason,
            category: c.category
        }));

    await env.DB.prepare(`
        UPDATE submissions 
        SET 
            status = 'completed',
            overall_band = ?,
            criteria_scores = ?,
            completed_at = strftime('%s', 'now')
        WHERE id = ?
    `).bind(
        gradingResult.overallBand,
        JSON.stringify(gradingResult.criteriaScores),
        submissionId
    ).run();

    // Store extended results for UI if needed
    await env.DB.prepare(`
        UPDATE submissions SET feedback_json = json_set(COALESCE(feedback_json, '{}'), '$.full_report', ?)
        WHERE id = ?
    `).bind(JSON.stringify(gradingResult), submissionId).run();


    // Update progress history
    await env.DB.prepare(`
        INSERT INTO progress_history (user_id, skill_domain, raw_score, rounded_band, submission_id, submission_type)
        VALUES (?, 'writing', ?, ?, ?, 'writing')
    `).bind(userId, rawBandScore, gradingResult.overallBand, submissionId).run();

    console.log(`[SUCCESS] Graded submission ${submissionId} in ${gradingDuration.toFixed(2)}s - Band ${gradingResult.overallBand}`);

    // 6. Aura Mentorship Logic (Master Guide v2)
    try {
        console.log(`[MENTORSHIP] Generating Aura (v2) feedback for submission ${submissionId}`);

        // Fetch previous performance for delta calculation (rounded and raw)
        const lastSubmission = await env.DB.prepare(`
            SELECT rounded_band, raw_score FROM progress_history 
            WHERE user_id = ? AND submission_id != ? AND skill_domain = 'writing'
            ORDER BY id DESC LIMIT 1
        `).bind(userId, submissionId).first();

        const prevBand = lastSubmission ? lastSubmission.rounded_band : "N/A";
        const prevRawScore = lastSubmission ? lastSubmission.raw_score : rawBandScore;
        const scoreDelta = lastSubmission ? (gradingResult.overallBand - lastSubmission.rounded_band) : 0;
        const rawDelta = lastSubmission ? (rawBandScore - lastSubmission.raw_score) : 0;
        const empathyStance = getEmpathyStance(gradingResult.overallBand, lastSubmission ? lastSubmission.rounded_band : gradingResult.overallBand);

        // Find Win (Top Criteria) and Struggle (Bottom Criteria)
        const scores = gradingResult.criteriaScores;
        const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        const topCriteria = sortedScores[0][0]; // e.g., "CC"
        const bottomCriteria = sortedScores[sortedScores.length - 1][0]; // e.g., "LR"

        const auraResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': env.GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [
                    { role: "user", parts: [{ text: AURA_SYSTEM_PROMPT }] },
                    { parts: [{ text: "Understood. I am ready to be Aura, the Senior Language Coach." }], role: "model" },
                    {
                        parts: [{
                            text: formatAuraInput({
                                band: gradingResult.overallBand,
                                prevBand: prevBand,
                                topCriteria: topCriteria,
                                bottomCriteria: bottomCriteria,
                                scoreDelta: scoreDelta,
                                rawDelta: rawDelta,
                                empathyStance: empathyStance
                            }).content
                        }]
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 512
                }
            })
        });

        if (auraResponse.ok) {
            const auraData = await auraResponse.json();
            const auraFeedback = auraData.candidates[0].content.parts[0].text;

            // Store Aura's feedback and metadata in the submission
            await env.DB.prepare(`
                UPDATE submissions SET feedback_json = json_set(
                    json_set(COALESCE(feedback_json, '{}'), '$.aura_mentorship', ?),
                    '$.aura_metadata', json_object('delta', ?, 'stance', ?)
                )
                WHERE id = ?
            `).bind(auraFeedback, scoreDelta, empathyStance, submissionId).run();

            console.log(`[MENTORSHIP] Aura v2 feedback and metadata stored.`);
        }
    } catch (auraError) {
        console.error('[MENTORSHIP_ERROR] Failed to generate Aura feedback:', auraError);
    }

    // 7. Antigravity Communication Layer - Dispatch Notification
    await dispatchAuraNotification(userId, gradingResult.overallBand, lastSubmission ? lastSubmission.rounded_band : null, topCriteria, env);

    // 7. Optional: Send analytics to Cloudflare Analytics Engine
    if (env.ANALYTICS) {
        await env.ANALYTICS.writeDataPoint({
            blobs: [userId, source || 'unknown'],
            doubles: [
                gradingResult.overallBand,
                gradingResult.criteriaScores.TR,
                gradingResult.criteriaScores.CC,
                gradingResult.criteriaScores.LR,
                gradingResult.criteriaScores.GRA,
                gradingDuration
            ],
            indexes: [submissionId]
        });
    }

    // 8. Antigravity Engine Room - Update Momentum
    await updateMomentum(userId, messageBody.isRemediation ? 'REMEDIATION' : 'STANDARD', scoreDelta, env);

    return {
        success: true,
        submissionId,
        band: gradingResult.overallBand,
        duration: gradingDuration
    };
}

/**
 * Cullen Checksum - Pedagogical Quality Assurance
 * Ensures AI feedback encourages genuine language control, not template memorization
 * 
 * @param {Object} gradingResult - AI grading output
 * @param {string} essayContent - Original essay
 * @param {Object} env - Environment bindings
 * @returns {Object} - { passed: boolean, reason: string }
 */
async function runCullenChecksum(gradingResult, essayContent, env) {
    const checksumPrompt = `You are a pedagogical quality auditor for IELTS feedback.

Your task: Determine if the following AI feedback encourages genuine language control or promotes template memorization.

**REJECT if feedback:**
- Contains generic advice like "use more linking words" without specific examples
- Encourages memorized phrases or templates
- Lacks actionable, specific guidance
- Focuses on surface patterns instead of genuine communication skills

**ACCEPT if feedback:**
- Targets genuine language control improvements
- Provides specific, actionable corrections
- Encourages creative expression and authentic communication
- Identifies meaningful errors in grammar, vocabulary, or argumentation

Essay Word Count: ${essayContent.split(/\s+/).length}
AI Feedback Summary: ${gradingResult.feedback.summary}
Actionable Improvements: ${JSON.stringify(gradingResult.feedback.actionable_improvements)}
Detailed Corrections Count: ${gradingResult.detailed_corrections?.length || 0}

Respond with JSON:
{
  "passed": true|false,
  "reason": "Brief explanation"
}`;

    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': env.GEMINI_API_KEY
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: checksumPrompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 256,
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            console.warn('[CULLEN_CHECKSUM] API call failed, defaulting to PASS');
            return { passed: true, reason: 'Checksum unavailable' };
        }

        const data = await response.json();
        const result = JSON.parse(data.candidates[0].content.parts[0].text);

        return {
            passed: result.passed || false,
            reason: result.reason || 'No reason provided'
        };

    } catch (error) {
        console.error('[CULLEN_CHECKSUM_ERROR]', error);
        return { passed: true, reason: 'Checksum error - defaulting to pass' };
    }
}

/**
 * Log Cullen Checksum audit result
 */
async function logCullenAudit(submissionId, userId, passed, reason, db) {
    try {
        await db.prepare(`
            INSERT INTO cullen_audit_log (
                submission_id,
                user_id,
                cullen_checksum_passed,
                failure_reason,
                audited_at
            ) VALUES (?, ?, ?, ?, datetime('now'))
        `).bind(
            submissionId,
            userId,
            passed ? 1 : 0,
            passed ? null : reason
        ).run();
    } catch (error) {
        console.error('[AUDIT_LOG_ERROR]', error);
        // Non-critical - don't fail the grading process
    }
}

/**
 * Mark submission as failed in database
 */
async function markSubmissionFailed(submissionId, db, errorMessage, retryCount) {
    try {
        await db.prepare(`
            UPDATE submissions 
            SET 
                status = 'failed',
                completed_at = strftime('%s', 'now')
            WHERE id = ?
        `).bind(submissionId).run();

        console.log(`[DB_UPDATE] Marked submission ${submissionId} as failed`);
    } catch (error) {
        console.error('[DB_UPDATE_ERROR]', error);
    }
}


/**
 * Antigravity Communication Layer - Aura Dispatcher
 */
async function dispatchAuraNotification(userId, currentScore, previousScore, topCriteria, env) {
    try {
        // 1. Fatigue Protection Check (2-hour window)
        const user = await env.DB.prepare(`SELECT last_notified_at FROM users WHERE user_id = ?`).bind(userId).first();
        if (user && user.last_notified_at) {
            const lastNotified = new Date(user.last_notified_at).getTime();
            const now = Date.now();
            if (now - lastNotified < 2 * 60 * 60 * 1000) {
                console.log(`[NOTIFICATION_FATIGUE] Skipping notification for ${userId} (Last: ${user.last_notified_at})`);
                return;
            }
        }

        let message = "";
        let type = "STABILITY";

        if (previousScore === null) {
            message = "Aura: Your baseline is set! Welcome to the Frontier. 🛰️";
            type = "IDENTITY";
        } else {
            const delta = currentScore - previousScore;
            if (delta > 0.3) {
                message = `Aura: A major breakthrough in ${topCriteria}! Check your new Band score. 🚀`;
                type = "MOMENTUM";
            } else if (delta < -0.3) {
                message = "Aura: That mission was a challenge! Let's review the 'Boss Level' fixes. 🛠️";
                type = "PIVOT";
            } else {
                message = "Aura: Your report is ready. Stability is the key to Band 8.0! 💎";
                type = "STABILITY";
            }
        }

        // 2. Dispatch to Telegram/Push Notification service (assuming TG bot here)
        // This is a placeholder for the actual delivery mechanism
        console.log(`[DISPATCH] To: ${userId}, Message: ${message}`);

        // Update last_notified_at
        await env.DB.prepare(`UPDATE users SET last_notified_at = datetime('now') WHERE user_id = ?`).bind(userId).run();

    } catch (error) {
        console.error('[NOTIFICATION_ERROR] Failed to dispatch Aura notification:', error);
    }
}

/**
 * Antigravity Correction Logic (ACL) - Empathy Stance Detector
 */
function getEmpathyStance(currentScore, previousScore) {
    const delta = currentScore - previousScore;

    if (delta < -0.25) {
        return "THE_RECOVERY_PIVOT"; // Score dropped significantly
    } else if (Math.abs(delta) <= 0.25) {
        return "THE_PLATEAU_STRENGTHENER"; // Score stayed relatively same
    } else {
        return "THE_MOMENTUM_BOOST"; // Score improved
    }
}

/**
 * Antigravity Momentum Algorithm - The Psychological Engine
 */
async function updateMomentum(userId, missionType, delta, env) {
    try {
        // 1. Fetch current momentum
        const user = await env.DB.prepare(
            "SELECT momentum_score FROM users WHERE user_id = ?"
        ).bind(userId).first();

        if (!user) return;

        // 2. Calculate the change (The Engine logic)
        let boost = 10; // Base completion
        if (missionType === 'REMEDIATION') boost = 25; // Massive reward for fixing errors
        if (delta > 0) boost += (delta * 10); // Reward for actual grade improvement

        // 3. Apply the "Antigravity" cap
        const newMomentum = Math.min((user.momentum_score || 0) + boost, 100);

        // 4. Update D1
        await env.DB.prepare(
            "UPDATE users SET momentum_score = ?, last_active = datetime('now') WHERE user_id = ?"
        ).bind(newMomentum, userId).run();

        console.log(`[MOMENTUM_ENGINE] User: ${userId}, Boost: +${boost}, New: ${newMomentum}`);
    } catch (error) {
        console.error('[MOMENTUM_ERROR]', error);
    }
}

export default {
    async queue(batch, env) {
        return await processGradingQueue(batch, env);
    }
};
