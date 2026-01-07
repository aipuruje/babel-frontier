import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';

const PDF_BOOKS = {
    'Cambridge_Grammar_for_IELTS': {
        r2Key: 'Cambridge_Grammar_for_IELTS.pdf',
        name: 'Cambridge Grammar for IELTS',
        type: 'grammar_rule',
        difficulty: 'intermediate',
        skillArea: 'grammar'
    },
    'Cambridge_Vocabulary_for_IELTS': {
        r2Key: 'Cambridge_Vocabulary_for_IELTS.pdf',
        name: 'Cambridge Vocabulary for IELTS',
        type: 'vocabulary',
        difficulty: 'intermediate',
        skillArea: 'vocabulary'
    },
    'The_Key_to_IELTS_Academic_Writing_Task_1': {
        r2Key: 'The_Key_to_IELTS_Academic_Writing_Task_1.pdf',
        name: 'The Key to IELTS Academic Writing Task 1',
        type: 'writing_template',
        difficulty: 'advanced',
        skillArea: 'writing'
    },
    'THE_KEY_TO_IELTS_WRITING': {
        r2Key: 'THE_KEY_TO_IELTS_WRITING.pdf',
        name: 'The Key to IELTS Writing',
        type: 'writing_template',
        difficulty: 'advanced',
        skillArea: 'writing'
    },
    'Key_to_IELTS_Success_2021': {
        r2Key: 'Key_to_IELTS_Success_2021.pdf',
        name: 'Key to IELTS Success 2021',
        type: 'strategy',
        difficulty: 'intermediate',
        skillArea: 'general'
    },
    'Common_Mistakes_at_IELTS_Advanced': {
        r2Key: 'Common_Mistakes_at_IELTS_Advanced.pdf',
        name: 'Common Mistakes at IELTS Advanced',
        type: 'common_mistake',
        difficulty: 'advanced',
        skillArea: 'grammar'
    },
    'Common_Mistakes_at_IELTS_Intermediate': {
        r2Key: 'Common_Mistakes_at_IELTS_Intermediate.pdf',
        name: 'Common Mistakes at IELTS Intermediate',
        type: 'common_mistake',
        difficulty: 'intermediate',
        skillArea: 'grammar'
    }
};

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Status check
        if (url.pathname === '/' || url.pathname === '/status') {
            return new Response(JSON.stringify({
                status: 'online',
                worker: 'PDF Extractor',
                books: Object.keys(PDF_BOOKS).length,
                endpoints: [
                    'POST /extract?book=<bookSlug>',
                    'POST /extract-all',
                    'GET /list-books'
                ]
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // List available books
        if (url.pathname === '/list-books') {
            return new Response(JSON.stringify({
                books: Object.entries(PDF_BOOKS).map(([slug, meta]) => ({
                    slug,
                    name: meta.name,
                    type: meta.type
                }))
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Extract single book
        if (url.pathname === '/extract' && request.method === 'POST') {
            const bookSlug = url.searchParams.get('book');
            if (!bookSlug || !PDF_BOOKS[bookSlug]) {
                return new Response(JSON.stringify({
                    error: 'Invalid book slug',
                    availableBooks: Object.keys(PDF_BOOKS)
                }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
            return await extractSinglePDF(env, bookSlug, corsHeaders);
        }

        // Extract all books
        if (url.pathname === '/extract-all' && request.method === 'POST') {
            return await extractAllPDFs(env, corsHeaders);
        }

        return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
};

async function extractSinglePDF(env, bookSlug, corsHeaders) {
    const bookMeta = PDF_BOOKS[bookSlug];
    const startTime = Date.now();

    try {
        console.log(`[${bookSlug}] Starting extraction`);

        // Fetch from public R2 URL
        const pdfUrl = `https://pub-0a7a4dd1a6604be2b34ef013fe4bef6c.r2.dev/${bookMeta.r2Key}`;
        console.log(`[${bookSlug}] Fetching: ${pdfUrl}`);

        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) {
            return new Response(JSON.stringify({
                error: `Failed to fetch PDF: ${pdfResponse.statusText}`,
                url: pdfUrl
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        console.log(`[${bookSlug}] Loaded ${pdfBuffer.byteLength} bytes`);

        // Extract with PDF.js
        const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(pdfBuffer),
            useWorkerFetch: false,
            isEvalSupported: false
        });

        const pdfDocument = await loadingTask.promise;
        const numPages = pdfDocument.numPages;
        console.log(`[${bookSlug}] PDF loaded: ${numPages} pages`);

        // Extract text
        let fullText = '';
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';

            if (pageNum % 20 === 0) {
                console.log(`[${bookSlug}] Progress: ${pageNum}/${numPages} pages`);
            }
        }

        console.log(`[${bookSlug}] Extracted ${fullText.length} chars`);

        // CONTENT-TO-COMBAT: Extract Teaching Points via Gemini
        let teachingPoints = [];
        if (env.GEMINI_API_KEY) {
            try {
                const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: {
                            parts: [{
                                text: `Extract linguistic teaching points from IELTS pedagogy text. Return JSON array with: feature_type (cohesion/subordination/vocabulary/grammar/pronunciation), feature_name, band_requirement (4.0-9.0), teaching_example, common_mistake, target_skill (speaking/writing/both). Return ONLY valid JSON array, no markdown.`
                            }]
                        },
                        contents: [{
                            parts: [{
                                text: `Source: ${bookMeta.name}\n\nText:\n${fullText.substring(0, 50000)}\n\nExtract all teaching points as JSON array.`
                            }]
                        }]
                    })
                });

                if (geminiResponse.ok) {
                    const geminiData = await geminiResponse.json();
                    const text = geminiData.candidates[0].content.parts[0].text;
                    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/);
                    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
                    teachingPoints = JSON.parse(jsonString);
                    console.log(`[${bookSlug}] Extracted ${teachingPoints.length} teaching points`);
                } else {
                    console.warn(`[${bookSlug}] Gemini API failed: ${geminiResponse.statusText}`);
                }
            } catch (e) {
                console.error(`[${bookSlug}] Teaching point extraction error:`, e.message);
            }
        }

        // Chunk
        const chunks = intelligentChunk(fullText, bookMeta);
        console.log(`[${bookSlug}] Created ${chunks.length} chunks`);

        // Insert chunks to D1
        let inserted = 0;
        for (const chunk of chunks) {
            await env.DB.prepare(`
        INSERT INTO ielts_knowledge_chunks 
        (source_book, chunk_type, title, content, difficulty, skill_area, page_reference, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
                chunk.source_book,
                chunk.chunk_type,
                chunk.title,
                chunk.content,
                chunk.difficulty,
                chunk.skill_area,
                chunk.page_reference,
                chunk.metadata
            ).run();
            inserted++;
        }

        // Insert teaching points to D1
        let teachingPointsInserted = 0;
        for (const point of teachingPoints) {
            try {
                await env.DB.prepare(`
                    INSERT INTO pdf_teaching_points 
                    (source_pdf, chapter, feature_type, feature_name, band_requirement, teaching_example, common_mistake, target_skill, created_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    bookMeta.name,
                    point.chapter || 'General',
                    point.feature_type,
                    point.feature_name,
                    point.band_requirement || 5.0,
                    point.teaching_example || '',
                    point.common_mistake || '',
                    point.target_skill || 'both',
                    new Date().toISOString()
                ).run();
                teachingPointsInserted++;
            } catch (e) {
                console.error(`[${bookSlug}] Teaching point DB insert error:`, e.message);
            }
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        return new Response(JSON.stringify({
            success: true,
            book: bookMeta.name,
            pages: numPages,
            textLength: fullText.length,
            chunks: chunks.length,
            inserted: inserted,
            teachingPoints: teachingPoints.length,
            teachingPointsInserted: teachingPointsInserted,
            durationSeconds: parseFloat(duration),
            message: `Successfully extracted ${inserted} chunks and ${teachingPointsInserted} teaching points from ${bookMeta.name}`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error(`[${bookSlug}] Error:`, error);
        return new Response(JSON.stringify({
            error: error.message,
            book: bookMeta.name,
            stack: error.stack
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

async function extractAllPDFs(env, corsHeaders) {
    const results = [];
    const startTime = Date.now();

    for (const [bookSlug, bookMeta] of Object.entries(PDF_BOOKS)) {
        console.log(`Processing: ${bookMeta.name}`);
        try {
            const response = await extractSinglePDF(env, bookSlug, corsHeaders);
            const result = await response.json();
            results.push(result);
        } catch (error) {
            results.push({
                book: bookMeta.name,
                error: error.message,
                success: false
            });
        }
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    const successCount = results.filter(r => r.success).length;
    const totalChunks = results.reduce((sum, r) => sum + (r.chunks || 0), 0);

    return new Response(JSON.stringify({
        success: successCount === results.length,
        totalBooks: results.length,
        successful: successCount,
        failed: results.length - successCount,
        totalChunks: totalChunks,
        durationSeconds: parseFloat(totalDuration),
        results: results
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

function intelligentChunk(text, bookMeta) {
    const chunks = [];
    const sections = text.split(/(?:Unit \d+|Chapter \d+|Section \d+|Exercise \d+|Task \d+)/i);

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (section.length < 50) continue;

        const lines = section.split('\n').filter(l => l.trim());
        const title = lines[0] ? lines[0].trim().substring(0, 200) : `Section ${i + 1}`;
        const content = lines.slice(1).join(' ').substring(0, 1500).trim();

        if (content.length > 100) {
            chunks.push({
                source_book: bookMeta.name,
                chunk_type: bookMeta.type,
                title: title,
                content: content,
                difficulty: bookMeta.difficulty,
                skill_area: bookMeta.skillArea,
                page_reference: `Approx page ${Math.floor((i * 2) + 1)}`,
                metadata: JSON.stringify({ sectionIndex: i, bookType: bookMeta.type })
            });
        }
    }

    return chunks;
}
