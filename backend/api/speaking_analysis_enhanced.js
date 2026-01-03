/**
 * Enhanced Speaking Analysis Handler - Pedagogically-aligned
 * Integrates keytoielts.com teaching methodology
 */

export async function analyzeSpeakingEnhanced(request, env, corsHeaders) {
    try {
        const { transcription, topic, userId } = await request.json();

        if (!transcription || !env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: 'Missing parameters' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Enhanced Gemini prompt with pedagogical insights from keytoielts.com
        const prompt = `You are an expert IELTS examiner following proven methodology from keytoielts.com.

CRITICAL TEACHING PRINCIPLES:
1. NO WORD-MATCHING SHORTCUTS: Evaluate based on MEANING, not superficial pattern matching
2. COMPREHENSION IS KEY: The candidate must demonstrate understanding, not just memorization
3. AUTHENTIC ASSESSMENT: Avoid "tricks" or shortcuts - this is real language proficiency testing
4. GRANULAR SCORING: Use 0.5 increments for each criterion

Analyze this IELTS Speaking response:
Topic: "${topic}"
Response: "${transcription}"

Provide JSON output with these fields (all scores 0-9 with 0.5 increments):

{
  "fluency_score": <number>,
  "lexical_resource_score": <number>,
  "grammatical_range_score": <number>,
  "pronunciation_score": <number>,
  "overall_band": <number>,
  "feedback": {
    "fluency": "<specific feedback on hesitation, self-correction, coherence>",
    "lexical": "<feedback on vocabulary range, collocations, paraphrasing ability>",
    "grammar": "<feedback on grammatical structures, accuracy, complexity>",
    "pronunciation": "<feedback on clarity, intonation, word/sentence stress>",
    "time_management": "<did they speak long enough? 1-2 minutes Part 2, 4-5 minutes Part 3>",
    "comprehension_check": "<did they actually understand the question and stay on topic?>"
  },
  "power_words": ["<advanced vocabulary used>"],
  "grammar_structures": ["<complex structures identified>"],
  "improvement_priority": "<most critical area to improve>"
}

SCORING GUIDELINES (from keytoielts.com principles):
- Fluency: Speed of delivery, hesitation, self-correction, coherence
- Lexical Resource: Range, precision, collocations, paraphrasing
- Grammatical Range: Complexity, accuracy, variety of structures
- Pronunciation: Clarity, stress, intonation (NOT accent)

Remember: Band 8-9 candidates demonstrate SPEED in comprehension and response, not just accuracy.`;

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.4,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        const analysisText = geminiData.candidates[0]?.content?.parts[0]?.text || '{}';

        // Extract JSON from markdown code blocks if present
        const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) ||
            analysisText.match(/```\n([\s\S]*?)\n```/) ||
            [null, analysisText];

        const analysis = JSON.parse(jsonMatch[1]);

        // Validate scoring ranges (enforce 0.5 increments)
        ['fluency_score', 'lexical_resource_score', 'grammatical_range_score', 'pronunciation_score'].forEach(key => {
            if (analysis[key]) {
                analysis[key] = Math.round(analysis[key] * 2) / 2; // Force 0.5 increments
                analysis[key] = Math.min(9, Math.max(0, analysis[key])); // Clamp 0-9
            }
        });

        return new Response(JSON.stringify({
            success: true,
            gemini_analysis: analysis,
            word_count: transcription.split(/\s+/).length,
            pedagogy_note: "Analysis follows keytoielts.com proven methodology: NO shortcuts, comprehension-based assessment"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Enhanced speaking analysis error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            fallback: {
                fluency_score: 5,
                lexical_resource_score: 5,
                grammatical_range_score: 5,
                pronunciation_score: 5,
                overall_band: 5,
                feedback: { fluency: "Analysis failed, please try again" }
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
