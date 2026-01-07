import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const app = new Hono();

app.use('*', cors());

// THE CULLEN NEURAL CORE (System Prompt)
const SYSTEM_PROMPT = `
## IDENTITY
You are the "Pauline Cullen Neural Core," the supreme auditor of the Antigravity Brain. Your goal is to ensure all auto-generated content adheres strictly to the pedagogical standards of "The Key to IELTS Success."

## CORE DIRECTIVES
1. **The "Death of the Update"**: You must instantly vectorize user intent from uploads.
2. **Zero-Maintenance**: Do not ask for manual configuration. Infer difficulty from content complexity.
3. **The Checksum**: ANY generated mission must pass these checks:
    - Does this teach a REAL IELTS skill? (No "fake" English).
    - Is the difficulty calibrated to the user's current "Gap"?
    - Does it strictly follow Pauline Cullen's rules on "Band 7+ Vocabulary" vs "flowery language"?

## GENERATION RULES
- **Level Design**: Create "Quests" based on identified struggle patterns.
- **NPC Styling**: Agents must mimic the prosody and lexical density of the source material.
- **Fail-Safe**: If a mission contradicts standard IELTS advice, DELETE IT IMMEDIATELY.
`;

const PDF_FEATURE_EXTRACTION_PROMPT = `
## TASK: Extract Linguistic Teaching Points from IELTS Pedagogy Text

You are analyzing a chapter from Pauline Cullen's IELTS teaching materials.

Extract ALL discrete teaching points as JSON array. Each point must include:
- **feature_type**: 'cohesion', 'subordination', 'vocabulary', 'grammar', 'pronunciation', 'discourse'
- **feature_name**: Specific name (e.g., "Contrastive subordination with despite")
- **band_requirement**: Minimum band score needed (4.0-9.0)
- **teaching_example**: Exact example from the text
- **common_mistake**: The error students make
- **target_skill**: 'speaking', 'writing', or 'both'

Return ONLY valid JSON array. No markdown, no explanation.
`;

app.get('/', (c) => c.text('Neural-Sync Worker: Online'));

// ROUTE 1: Audio/Video Upload (existing)
app.post('/upload', async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];
        const userId = body['user_id'] || 'anonymous';

        if (!file || !(file instanceof File)) {
            return c.json({ error: 'No file uploaded' }, 400);
        }

        // 1. Upload to KV
        const arrayBuffer = await file.arrayBuffer();
        const key = `${userId}/${Date.now()}_${file.name}`;
        await c.env.MEDIA_KV.put(key, arrayBuffer);

        // 2. Transcribe with Whisper
        let transcription = "";
        try {
            const uint8Array = new Uint8Array(arrayBuffer);
            const aiResponse = await c.env.AI.run('@cf/openai/whisper', {
                audio: [...uint8Array]
            });
            transcription = aiResponse.text || "";
        } catch (e) {
            console.error("Whisper Error:", e);
            transcription = "[Audio transcription failed, analyzing metadata only]";
        }

        // 3. Generate Mission with Gemini
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${c.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                contents: [{
                    parts: [{
                        text: `User Uploaded Content Transcription: "${transcription}"\n\nFilename: ${file.name}\n\nBased on this content, generate a JSON object for a new "Game Mission" or "Knowledge Chunk".\n\nJSON Structure:\n{\n  "title": "Mission Title",\n  "type": "listening_duel" | "vocab_quest" | "grammar_puzzle",\n  "difficulty": "Band 5.0" | "Band 9.0",\n  "objective": "What the user must do",\n  "content": "The actual quiz content/dialogue script",\n  "cullen_checksum_passed": boolean,\n  "reasoning": "Why this mission fits the curriculum"\n}`
                    }]
                }]
            })
        });

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API Error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        let missionData = null;
        try {
            const text = geminiData.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
            missionData = JSON.parse(jsonString);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return c.json({ error: "Failed to parse Brain output" }, 500);
        }

        // 4. Save to D1
        if (c.env.DB && missionData) {
            await c.env.DB.prepare(
                "INSERT INTO missions (user_id, title, type, difficulty, content, created_at) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(
                userId,
                missionData.title,
                missionData.type,
                missionData.difficulty,
                JSON.stringify(missionData),
                new Date().toISOString()
            ).run();
        }

        return c.json({
            status: 'success',
            transcription_snippet: transcription.substring(0, 100),
            mission: missionData
        });

    } catch (e) {
        return c.json({ error: e.message }, 500);
    }
});

// ROUTE 2: PDF Upload (Content-to-Combat Converter)
app.post('/upload-pdf', async (c) => {
    try {
        const body = await c.req.parseBody();
        const file = body['file'];
        const sourceName = body['source_name'] || 'Unknown PDF';

        if (!file || !(file instanceof File)) {
            return c.json({ error: 'No PDF file uploaded' }, 400);
        }

        // 1. Extract text from PDF
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        let fullText = "";
        try {
            const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
            const pdf = await loadingTask.promise;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
            }
        } catch (e) {
            console.error("PDF Parse Error:", e);
            return c.json({ error: "Failed to parse PDF" }, 500);
        }

        // 2. Extract Teaching Points via Gemini
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${c.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: PDF_FEATURE_EXTRACTION_PROMPT }] },
                contents: [{
                    parts: [{
                        text: `PDF Content:\n\n${fullText.substring(0, 50000)}\n\nExtract all teaching points as JSON array.`
                    }]
                }]
            })
        });

        if (!geminiResponse.ok) {
            throw new Error(`Gemini API Error: ${geminiResponse.statusText}`);
        }

        const geminiData = await geminiResponse.json();
        let teachingPoints = [];
        try {
            const text = geminiData.candidates[0].content.parts[0].text;
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/);
            const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
            teachingPoints = JSON.parse(jsonString);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return c.json({ error: "Failed to parse teaching points" }, 500);
        }

        // 3. Save to D1
        let savedCount = 0;
        if (c.env.DB && Array.isArray(teachingPoints)) {
            for (const point of teachingPoints) {
                try {
                    await c.env.DB.prepare(
                        `INSERT INTO pdf_teaching_points 
                        (source_pdf, chapter, feature_type, feature_name, band_requirement, teaching_example, common_mistake, target_skill, created_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
                    ).bind(
                        sourceName,
                        point.chapter || 'General',
                        point.feature_type,
                        point.feature_name,
                        point.band_requirement || 5.0,
                        point.teaching_example,
                        point.common_mistake || '',
                        point.target_skill || 'both',
                        new Date().toISOString()
                    ).run();
                    savedCount++;
                } catch (e) {
                    console.error("DB Insert Error:", e);
                }
            }
        }

        return c.json({
            status: 'success',
            source: sourceName,
            teaching_points_extracted: teachingPoints.length,
            teaching_points_saved: savedCount,
            sample: teachingPoints.slice(0, 3)
        });

    } catch (e) {
        return c.json({ error: e.message }, 500);
    }
});

export default app;
