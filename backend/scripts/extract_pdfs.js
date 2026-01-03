/**
 * PDF Extraction Script for IELTS Resources
 * Parses 8 PDF books and chunks them into D1 database
 */

// Note: This requires pdf-parse npm package
// Run: npm install pdf-parse --save (in backend directory)

import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse'; // Will need to install

const PDF_BOOKS = [
    {
        path: '../Cambridge_Grammar_for_IELTS_with_answers_Hopkins_Diane_Cullen_Pauline_2008_-272p.pdf',
        name: 'Cambridge Grammar for IELTS',
        type: 'grammar',
        difficulty: 'intermediate',
        skillArea: 'grammar'
    },
    {
        path: '../Cambridge_Vocabulary_for_IELTS.pdf',
        name: 'Cambridge Vocabulary for IELTS',
        type: 'vocabulary',
        difficulty: 'intermediate',
        skillArea: 'vocabulary'
    },
    {
        path: '../The_Key_to_IELTS_Academic_Writing_Task_1.pdf',
        name: 'The Key to IELTS Academic Writing Task 1',
        type: 'writing_template',
        difficulty: 'advanced',
        skillArea: 'writing'
    },
    {
        path: '../THE_KEY_TO_IELTS_WRITING_-_PAULINE_CULLEN.pdf',
        name: 'The Key to IELTS Writing',
        type: 'writing_template',
        difficulty: 'advanced',
        skillArea: 'writing'
    },
    {
        path: '../Key-to-IELTS-Success-2021.pdf',
        name: 'Key to IELTS Success 2021',
        type: 'strategy',
        difficulty: 'intermediate',
        skillArea: 'general'
    },
    {
        path: '../Common_Mistakes_at_IELTS_Advanced.pdf',
        name: 'Common Mistakes at IELTS Advanced',
        type: 'common_mistake',
        difficulty: 'advanced',
        skillArea: 'grammar'
    },
    {
        path: '../Common_Mistakes_at_IELTS_Intermediate.pdf',
        name: 'Common Mistakes at IELTS Intermediate',
        type: 'common_mistake',
        difficulty: 'intermediate',
        skillArea: 'grammar'
    }
];

/**
 * Extract text from PDF
 */
async function extractPDF(filePath) {
    try {
        const dataBuffer = await fs.readFile(path.resolve(__dirname, filePath));
        const data = await pdf(dataBuffer);
        return {
            text: data.text,
            numPages: data.numpages,
            info: data.info
        };
    } catch (error) {
        console.error(`Error extracting ${filePath}:`, error.message);
        return null;
    }
}

/**
 * Intelligent chunking algorithm
 * Splits text by pedagogical units (headings, sections, examples)
 */
function intelligentChunk(text, bookMeta) {
    const chunks = [];

    // Split by common heading patterns in IELTS books
    const sections = text.split(/(?:Unit \d+|Chapter \d+|Section \d+|Exercise \d+|Task \d+)/i);

    for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (section.length < 50) continue; // Skip very short sections

        // Extract title (first line)
        const lines = section.split('\n');
        const title = lines[0].trim().substring(0, 200);

        // Get content (rest of lines, max 2000 chars for efficient retrieval)
        const content = lines.slice(1).join('\n').substring(0, 2000).trim();

        if (content.length > 100) {
            chunks.push({
                source_book: bookMeta.name,
                chunk_type: bookMeta.type,
                title: title || `Section ${i + 1}`,
                content: content,
                difficulty: bookMeta.difficulty,
                skill_area: bookMeta.skillArea,
                page_reference: `Approx page ${Math.floor(i / 2)}`, // Rough estimate
                metadata: JSON.stringify({ sectionIndex: i })
            });
        }
    }

    return chunks;
}

/**
 * Save chunks to D1 database
 */
async function saveChunksToD1(chunks, db) {
    const stmt = db.prepare(`
    INSERT INTO ielts_knowledge_chunks 
    (source_book, chunk_type, title, content, difficulty, skill_area, page_reference, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (const chunk of chunks) {
        await stmt.bind(
            chunk.source_book,
            chunk.chunk_type,
            chunk.title,
            chunk.content,
            chunk.difficulty,
            chunk.skill_area,
            chunk.page_reference,
            chunk.metadata
        ).run();
    }

    console.log(`✅ Saved ${chunks.length} chunks from ${chunks[0].source_book}`);
}

/**
 * Main extraction function
 */
export async function extractAllPDFs(db) {
    console.log('🚀 Starting PDF extraction...');
    let totalChunks = 0;

    for (const book of PDF_BOOKS) {
        console.log(`\n📖 Processing: ${book.name}`);

        const pdfData = await extractPDF(book.path);
        if (!pdfData) {
            console.log(`❌ Skipping ${book.name} - extraction failed`);
            continue;
        }

        console.log(`   Pages: ${pdfData.numPages}`);
        console.log(`   Text length: ${pdfData.text.length} characters`);

        const chunks = intelligentChunk(pdfData.text, book);
        console.log(`   Chunks created: ${chunks.length}`);

        await saveChunksToD1(chunks, db);
        totalChunks += chunks.length;
    }

    console.log(`\n✅ Extraction complete! Total chunks: ${totalChunks}`);
    return totalChunks;
}

/**
 * CLI interface (for manual runs)
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('PDF Extraction Script');
    console.log('This should be run from the backend directory');
    console.log('Usage: node --experimental-modules scripts/extract_pdfs.js');
}
