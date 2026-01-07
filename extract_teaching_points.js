// Content-to-Combat: Local PDF Teaching Point Extractor
// Run this script to process Cullen PDFs and extract teaching points to D1
// Usage: node extract_teaching_points.js <pdf_file_path>

import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import fetch from 'node-fetch';

const GEMINI_API_KEY = 'AIzaSyCydNw1IJ3bw4yP2RDsWY83mI8BNuvSqeA';
const D1_DATABASE_ID = 'f6eda8be-9212-4e22-b741-4485d0d4f6b5';

const SYSTEM_PROMPT = `Extract linguistic teaching points from IELTS pedagogy text. 
Return JSON array with:
- feature_type: 'cohesion', 'subordination', 'vocabulary', 'grammar', 'pronunciation'
- feature_name: Specific name
- band_requirement: 4.0-9.0
- teaching_example: Exact example from text
- common_mistake: Student error
- target_skill: 'speaking', 'writing', or 'both'

Return ONLY valid JSON array, no markdown.`;

async function extractPDF(pdfPath) {
    console.log(`Reading PDF: ${pdfPath}`);
    const data = new Uint8Array(fs.readFileSync(pdfPath));

    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    console.log(`Pages: ${pdf.numPages}`);
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';

        if (i % 20 === 0) {
            console.log(`Progress: ${i}/${pdf.numPages}`);
        }
    }

    return fullText;
}

async function extractTeachingPoints(text, sourceName) {
    console.log('\nExtracting teaching points via Gemini...');

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{
                parts: [{
                    text: `Source: ${sourceName}\n\nText:\n${text.substring(0, 50000)}\n\nExtract all teaching points as JSON array.`
                }]
            }]
        })
    });

    const data = await response.json();
    const text_response = data.candidates[0].content.parts[0].text;
    const jsonMatch = text_response.match(/```json\n([\s\S]*?)\n```/) || text_response.match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text_response;

    return JSON.parse(jsonString);
}

async function saveToD1(teachingPoints, sourceName) {
    console.log(`\nSaving ${teachingPoints.length} teaching points to D1...`);

    // This would use wrangler d1 execute commands
    // For now, output SQL for manual execution
    const sqlStatements = teachingPoints.map(point => {
        const values = [
            sourceName,
            point.chapter || 'General',
            point.feature_type,
            point.feature_name,
            point.band_requirement || 5.0,
            (point.teaching_example || '').replace(/'/g, "''"),
            (point.common_mistake || '').replace(/'/g, "''"),
            point.target_skill || 'both'
        ];

        return `INSERT INTO pdf_teaching_points (source_pdf, chapter, feature_type, feature_name, band_requirement, teaching_example, common_mistake, target_skill, created_at) VALUES ('${values[0]}', '${values[1]}', '${values[2]}', '${values[3]}', ${values[4]}, '${values[5]}', '${values[6]}', '${values[7]}', datetime('now'));`;
    });

    fs.writeFileSync('teaching_points.sql', sqlStatements.join('\n'));
    console.log('\n✅ SQL written to teaching_points.sql');
    console.log('\nTo import:');
    console.log(`  cd d:\\apps\\game\\neural-sync-worker`);
    console.log(`  npx wrangler d1 execute babel-frontier-db --file=../teaching_points.sql`);
}

// Main
const pdfPath = process.argv[2];
if (!pdfPath) {
    console.error('Usage: node extract_teaching_points.js <pdf_file_path>');
    process.exit(1);
}

const sourceName = pdfPath.split(/[\/\\]/).pop().replace('.pdf', '');

(async () => {
    const text = await extractPDF(pdfPath);
    console.log(`Extracted ${text.length} characters`);

    const teachingPoints = await extractTeachingPoints(text, sourceName);
    console.log(`\n📚 Extracted ${teachingPoints.length} teaching points`);
    console.log('\nSample:', teachingPoints.slice(0, 2));

    await saveToD1(teachingPoints, sourceName);
})();
