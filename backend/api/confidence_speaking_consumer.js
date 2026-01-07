/**
 * Confidence-Based Speaking Feedback Consumer
 * Implements the "Confidence Filter" to distinguish Student Errors from Transcription Errors
 * 
 * Key Features:
 * 1. Uses Gemini 2.0 Flash for audio transcription with confidence estimates
 * 2. Tags low-confidence words (<0.6) as [unclear]
 * 3. Extracts fluency markers (filler count, long pauses)
 * 4. Sends sanitized transcript + metadata to IELTS AI
 */

/**
 * Main entry point for advanced speaking feedback generation
 * @param {ArrayBuffer} audioBuffer - Audio file data
 * @param {string} userId - User identifier
 * @param {Object} env - Environment bindings (GEMINI_API_KEY, DB, R2_BUCKET)
 * @returns {Object} - Complete feedback with confidence-aware scoring
 */
export async function generateSpeakingFeedbackWithConfidence(audioBuffer, userId, env) {
    const startTime = Date.now();

    // Step 1: Transcribe audio with Gemini 2.0 Flash (word-level confidence)
    console.log('[SPEAKING_FEEDBACK] Transcribing audio with Gemini 2.0 Flash...');
    const transcriptionResult = await transcribeWithConfidence(audioBuffer, env);

    // Step 2: Extract fluency markers
    console.log('[SPEAKING_FEEDBACK] Extracting fluency markers...');
    const { fillerCount, longPauses } = extractFluencyMarkers(
        transcriptionResult.words,
        transcriptionResult.pauses || []
    );

    // Step 3: Sanitize transcript by confidence
    console.log('[SPEAKING_FEEDBACK] Sanitizing transcript by confidence...');
    const sanitizedTranscript = sanitizeTranscriptByConfidence(transcriptionResult.words);
    const rawTranscript = transcriptionResult.words.map(w => w.text).join(' ');

    // Step 4: Call IELTS AI with contextual guardrails
    console.log('[SPEAKING_FEEDBACK] Calling IELTS AI grader...');
    const aiGradingResult = await callSpeakingAI(
        sanitizedTranscript,
        fillerCount,
        longPauses.length,
        env
    );

    // Step 5: Store in database
    const audioUrl = await uploadAudioToR2(audioBuffer, userId, env);
    const submissionId = await storeSpeakingSubmission({
        userId,
        audioUrl,
        rawTranscript,
        sanitizedTranscript,
        confidenceData: transcriptionResult.words,
        fillerCount,
        longPauseCount: longPauses.length,
        pauseData: longPauses,
        totalDuration: transcriptionResult.duration,
        ...aiGradingResult
    }, env);

    // Step 6: Update progress history
    await updateProgressHistory(
        userId,
        'speaking',
        aiGradingResult.raw_band_score,
        aiGradingResult.overall_band,
        submissionId,
        'speaking',
        env
    );

    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`[SPEAKING_FEEDBACK] Completed in ${processingTime.toFixed(2)}s`);

    return {
        success: true,
        submissionId,
        sanitizedTranscript,
        fillerCount,
        longPauseCount: longPauses.length,
        pauseData: longPauses,
        ...aiGradingResult,
        processingTimeSeconds: processingTime
    };
}

/**
 * Transcribe audio using Gemini 2.0 Flash with word-level confidence
 * @param {ArrayBuffer} audioBuffer - Audio file
 * @param {Object} env - Environment bindings
 * @returns {Object} - {words: [{text, confidence, start, end}], pauses: [{start, end, duration}], duration}
 */
async function transcribeWithConfidence(audioBuffer, env) {
    // Convert audio buffer to base64 for Gemini API
    const base64Audio = arrayBufferToBase64(audioBuffer);

    const prompt = `You are a speech-to-text transcription expert. Transcribe the following audio with word-level confidence scores.

For each word, estimate the confidence level (0.0 to 1.0) based on:
- Audio clarity
- Speaker pronunciation
- Background noise
- Word recognizability

Also detect pauses longer than 0.5 seconds.

Return JSON in this exact format:
{
  "words": [
    {"text": "hello", "confidence": 0.95, "start": 0.0, "end": 0.5},
    {"text": "world", "confidence": 0.88, "start": 0.6, "end": 1.1}
  ],
  "pauses": [
    {"start": 1.1, "end": 3.2, "duration": 2.1}
  ],
  "duration": 10.5
}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: 'audio/webm', // Adjust based on actual format
                                data: base64Audio
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1, // Low temperature for factual transcription
                    responseMimeType: "application/json"
                }
            })
        }
    );

    if (!response.ok) {
        throw new Error(`Gemini transcription failed: ${response.statusText}`);
    }

    const data = await response.json();
    const transcriptionData = JSON.parse(data.candidates[0].content.parts[0].text);

    return transcriptionData;
}

/**
 * Extract fluency markers from transcription
 * @param {Array} words - Array of {text, confidence, start, end}
 * @param {Array} pauses - Array of {start, end, duration}
 * @returns {Object} - {fillerCount, longPauses}
 */
function extractFluencyMarkers(words, pauses) {
    // Count filler words (um, uh, ah, er)
    const fillerPattern = /\b(um|uh|ah|er|umm|uhh)\b/i;
    const fillerCount = words.filter(w => fillerPattern.test(w.text)).length;

    // Filter pauses > 2 seconds (significant fluency breaks)
    const longPauses = pauses.filter(p => p.duration > 2.0);

    return { fillerCount, longPauses };
}

/**
 * Sanitize transcript by replacing low-confidence words with [unclear]
 * @param {Array} words - Array of {text, confidence, start, end}
 * @returns {string} - Sanitized transcript
 */
function sanitizeTranscriptByConfidence(words) {
    const CONFIDENCE_THRESHOLD = 0.6;

    return words.map(w =>
        w.confidence < CONFIDENCE_THRESHOLD ? '[unclear]' : w.text
    ).join(' ');
}

/**
 * Call IELTS AI with Speaking-specific prompt (accounts for [unclear] tags)
 * @param {string} sanitizedTranscript - Transcript with [unclear] tags
 * @param {number} fillerCount - Number of filler words
 * @param {number} longPauseCount - Number of pauses > 2s
 * @param {Object} env - Environment bindings
 * @returns {Object} - {fluency_score, lexical_resource_score, grammatical_range_score, pronunciation_score, overall_band, raw_band_score, feedback, improvement_priority, actionable_tip}
 */
async function callSpeakingAI(sanitizedTranscript, fillerCount, longPauseCount, env) {
    const prompt = `### ROLE
You are an IELTS Speaking Examiner grading a transcript generated by an AI (with confidence filtering).

### INPUT DATA
- Transcript: "${sanitizedTranscript}"
- Filler Count: ${fillerCount}
- Long Pauses (>2s): ${longPauseCount}

### GRADING INSTRUCTIONS
1. FLUENCY & COHERENCE (FC): 
   - Deduct points for high Filler Counts (>5 is problematic).
   - Significant penalties for Long Pauses (>3 total) unless they are for 'content thinking'.
   
2. PRONUNCIATION (P): 
   - Look for [unclear] tags. If they appear frequently on simple words, the student likely has "L1 interference" (strong accent affecting intelligibility).
   - DO NOT penalize grammar/pronunciation within [unclear] sections - those are transcription errors, not student errors.
   
3. LEXICAL RESOURCE (LR): 
   - Identify idiomatic expressions used naturally.
   - Only evaluate words NOT marked as [unclear].
   
4. GRAMMATICAL RANGE & ACCURACY (GRA): 
   - Only penalize errors in "High Confidence" text. Ignore errors in [unclear] sections.

### OUTPUT FORMAT
Return JSON with 0.5 increments for all scores:
{
  "fluency_score": <0.0-9.0>,
  "lexical_resource_score": <0.0-9.0>,
  "grammatical_range_score": <0.0-9.0>,
  "pronunciation_score": <0.0-9.0>,
  "overall_band": <0.0-9.0, rounded to nearest 0.5>,
  "raw_band_score": <0.0-9.0, unrounded for internal tracking>,
  "feedback": {
    "fluency": "...",
    "lexical": "...",
    "grammar": "...",
    "pronunciation": "..."
  },
  "improvement_priority": "fluency|lexical|grammar|pronunciation",
  "actionable_tip": "Your next Speaking Mission: [specific action]"
}`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.4,
                    responseMimeType: "application/json"
                }
            })
        }
    );

    if (!response.ok) {
        throw new Error(`IELTS AI grading failed: ${response.statusText}`);
    }

    const data = await response.json();
    const gradingResult = JSON.parse(data.candidates[0].content.parts[0].text);

    return gradingResult;
}

/**
 * Store speaking submission in D1
 */
async function storeSpeakingSubmission(data, env) {
    const result = await env.DB.prepare(`
        INSERT INTO speaking_submissions (
            user_id, audio_url, raw_transcript, sanitized_transcript, confidence_data,
            filler_count, long_pause_count, pause_data, total_duration_seconds,
            fluency_score, lexical_resource_score, grammatical_range_score, pronunciation_score,
            overall_band, raw_band_score, feedback, improvement_priority, actionable_tip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
        data.userId,
        data.audioUrl,
        data.rawTranscript,
        data.sanitizedTranscript,
        JSON.stringify(data.confidenceData),
        data.fillerCount,
        data.longPauseCount,
        JSON.stringify(data.pauseData),
        data.totalDuration,
        data.fluency_score,
        data.lexical_resource_score,
        data.grammatical_range_score,
        data.pronunciation_score,
        data.overall_band,
        data.raw_band_score,
        JSON.stringify(data.feedback),
        data.improvement_priority,
        data.actionable_tip
    ).run();

    return result.meta.last_row_id;
}

/**
 * Upload audio to R2 bucket
 */
async function uploadAudioToR2(audioBuffer, userId, env) {
    const timestamp = Date.now();
    const filename = `speaking/${userId}/${timestamp}.webm`;

    await env.R2_BUCKET.put(filename, audioBuffer, {
        httpMetadata: {
            contentType: 'audio/webm'
        }
    });

    return filename;
}

/**
 * Update progress history for motivation tracking
 */
async function updateProgressHistory(userId, skillDomain, rawScore, roundedBand, submissionId, submissionType, env) {
    await env.DB.prepare(`
        INSERT INTO progress_history (user_id, skill_domain, raw_score, rounded_band, submission_id, submission_type)
        VALUES (?, ?, ?, ?, ?, ?)
    `).bind(userId, skillDomain, rawScore, roundedBand, submissionId, submissionType).run();
}

/**
 * Utility: Convert ArrayBuffer to base64
 */
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
