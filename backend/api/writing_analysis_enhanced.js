/**
 * Enhanced Writing Analysis Handler - Pedagogically-aligned
 * Implements keytoielts.com Task 2 methodology
 */

export async function analyzeWritingEnhanced(request, env, corsHeaders) {
    try {
        const { text, promptType, userId } = await request.json();

        if (!text || !env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: 'Missing parameters' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const wordCount = text.split(/\s+/).length;

        // Pedagogical prompt based on keytoielts.com Writing Task 2 framework
        const prompt = `You are an expert IELTS Writing examiner following keytoielts.com methodology.

CRITICAL ASSESSMENT PRINCIPLES:
1. NO SHORTCUTS: Evaluate actual writing quality, not surface patterns
2. STRUCTURE MATTERS: Essay organization directly impacts score
3. ARGUMENTATION: Check for coherent development of ideas
4. GRANULAR SCORING: Use 0.5 increments for each criterion

Analyze this IELTS Writing Task 2 essay:
Word count: ${wordCount} (minimum 250
)
Essay: "${text}"

Provide JSON output:

{
  "task_achievement": <0-9 with 0.5 increments>,
  "coherence_cohesion": <0-9 with 0.5 increments>,
  "lexical_resource": <0-9 with 0.5 increments>,
  "grammatical_range_accuracy": <0-9 with 0.5 increments>,
  "overall_band": <0-9 with 0.5 increments>,
  "word_count_status": "<adequate/inadequate>",
  "feedback": {
    "task_achievement": "<did they answer ALL parts? clear position? relevant examples?>",
    "coherence_cohesion": "<logical paragraphing? discourse markers? idea progression?>",
    "lexical_resource": "<vocabulary range? collocations? spelling accuracy?>",
    "grammatical_range_accuracy": "<sentence variety? error-free sentences? complex structures?>"
  },
  "power_words": ["<academic/advanced vocabulary used>"],
  "structure_analysis": {
    "has_introduction": <boolean>,
    "has_conclusion": <boolean>,
    "body_paragraphs": <number>,
    "thesis_clarity": "<clear/unclear>"
  },
  "suggestions": [
    {
      "original": "<word/phrase>",
      "replacement": "<better alternative>",
      "power": <1-50 improvement points>,
      "reason": "<why this improves the essay>"
    }
  ],
  "improvement_priority": "<most critical area to focus on>"
}

TASK 2 SCORING CRITERIA (keytoielts.com framework):
- Task Achievement: Address ALL parts, clear position, relevant support
- Coherence & Cohesion: Logical organization, effective paragraphing, discourse markers
- Lexical Resource: Range, precision, collocations, spelling
- Grammatical Range & Accuracy: Variety, accuracy, complexity

${wordCount < 250 ? 'WARNING: Under 250 words = automatic penalty' : ''}`;

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
                        temperature: 0.3,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        const analysisText = geminiData.candidates[0]?.content?.parts[0]?.text || '{}';

        // Extract JSON
        const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) ||
            analysisText.match(/```\n([\s\S]*?)\n```/) ||
            [null, analysisText];

        const analysis = JSON.parse(jsonMatch[1]);

        // Enforce 0.5 increments and valid ranges
        ['task_achievement', 'coherence_cohesion', 'lexical_resource', 'grammatical_range_accuracy'].forEach(key => {
            if (analysis[key]) {
                analysis[key] = Math.round(analysis[key] * 2) / 2;
                analysis[key] = Math.min(9, Math.max(0, analysis[key]));
            }
        });

        return new Response(JSON.stringify({
            success: true,
            analysis: analysis,
            word_count: wordCount,
            pedagogy_note: "Analysis follows keytoielts.com Task 2 methodology"
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Enhanced writing analysis error:', error);
        return new Response(JSON.stringify({
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
