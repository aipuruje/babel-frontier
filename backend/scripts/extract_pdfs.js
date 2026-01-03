import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// Absolute paths from project root
const PROJECT_ROOT = 'D:/apps/game';

const PDF_BOOKS = [
    {
        path: join(PROJECT_ROOT, 'Cambridge_Grammar_for_IELTS_with_answers_Hopkins_Diane_Cullen_Pauline_2008_-272p.pdf'),
        name: 'Cambridge Grammar for IELTS',
        type: 'grammar_rule',
        difficulty: 'intermediate',
        skillArea: 'grammar'
    },
    {
        path: join(PROJECT_ROOT, 'Cambridge_Vocabulary_for_IELTS.pdf'),
        name: 'Cambridge Vocabulary for IELTS',
        type: 'vocabulary',
        difficulty: 'intermediate',
        skillArea: 'vocabulary'
    },
    {
        path: join(PROJECT_ROOT, 'The_Key_to_IELTS_Academic_Writing_Task_1.pdf'),
        name: 'The Key to IELTS Academic Writing Task 1',
        type: 'writing_template',
        difficulty: 'advanced',
        skillArea: 'writing'
    },
    {
        path: join(PROJECT_ROOT, 'THE_KEY_TO_IELTS_WRITING_-_PAULINE_CULLEN.pdf'),
        name: 'The Key to IELTS Writing',
        type: 'writing_template',
        difficulty: 'advanced',
        skillArea: 'writing'
    },
    {
        path: join(PROJECT_ROOT, 'Key-to-IELTS-Success-2021.pdf'),
        name: 'Key to IELTS Success 2021',
        type: 'strategy',
        difficulty: 'intermediate',
        skillArea: 'general'
    },
    {
        path: join(PROJECT_ROOT, 'Common_Mistakes_at_IELTS_Advanced.pdf'),
        name: 'Common Mistakes at IELTS Advanced',
        type: 'common_mistake',
        difficulty: 'advanced',
        skillArea: 'grammar'
    },
    {
        path: join(PROJECT_ROOT, 'Common_Mistakes_at_IELTS_Intermediate.pdf'),
        name: 'Common Mistakes at IELTS Intermediate',
        type: 'common_mistake',
        difficulty: 'intermediate',
        skillArea: 'grammar'
    }
];

async function extractPDF(filePath) {
    try {
        console.log(`   Reading: ${filePath}`);
        const dataBuffer = await readFile(filePath);
        const data = await pdfParse(dataBuffer);
        return {
            text: data.text,
            numPages: data.numpages
        };
    } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        return null;
    }
}

function intelligentChunk(text, bookMeta) {
    const chunks = [];

    // Split by common heading patterns
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

async function extractAllPDFs() {
    console.log('🚀 PDF Extraction Started\n');
    let totalChunks = 0;
    const allChunks = [];

    for (const book of PDF_BOOKS) {
        console.log(`\n📖 ${book.name}`);

        const pdfData = await extractPDF(book.path);
        if (!pdfData) {
            console.log(`   ⏭️  Skipped\n`);
            continue;
        }

        console.log(`   ✓ Pages: ${pdfData.numPages}`);
        console.log(`   ✓ Text: ${pdfData.text.length} chars`);

        const chunks = intelligentChunk(pdfData.text, book);
        console.log(`   ✓ Chunks: ${chunks.length}`);

        allChunks.push(...chunks);
        totalChunks += chunks.length;
    }

    // Save all chunks
    const jsonPath = join(PROJECT_ROOT, 'backend', 'extracted_chunks_ALL.json');
    await writeFile(jsonPath, JSON.stringify(allChunks, null, 2), 'utf-8');
    console.log(`\n\n💾 Saved ${totalChunks} chunks → extracted_chunks_ALL.json`);

    // Generate SQL
    const sqlStatements = allChunks.map(chunk => {
        const esc = (str) => str.replace(/'/g, "''").substring(0, 1500);
        return `INSERT INTO ielt s_knowledge_chunks (source_book, chunk_type, title, content, difficulty, skill_area, page_reference, metadata) VALUES ('${esc(chunk.source_book)}', '${chunk.chunk_type}', '${esc(chunk.title)}', '${esc(chunk.content)}', '${chunk.difficulty}', '${chunk.skill_area}', '${chunk.page_reference}', '${chunk.metadata}');`;
    }).join('\n');

    const sqlPath = join(PROJECT_ROOT, 'backend', 'knowledge_chunks_inserts.sql');
    await writeFile(sqlPath, sqlStatements, 'utf-8');
    console.log(`📝 Generated SQL → knowledge_chunks_inserts.sql`);

    console.log(`\n✅ Extraction Complete!`);
    console.log(`\nNext: wrangler d1 execute babel-frontier-db --remote --file=backend/knowledge_chunks_inserts.sql`);
}

extractAllPDFs().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
