/**
 * Audio File Organization Script
 * Creates metadata mapping for all 81 audio files from Cambridge Grammar & Vocabulary
 */

import fs from 'fs/promises';
import path from 'path';

const AUDIO_DIRECTORIES = [
    {
        path: '../124_1- Cambridge Grammar for IELTS with answers_Hopkins Diane, Cullen Pauline_2008 -CD',
        book: 'Cambridge Grammar for IELTS',
        type: 'grammar_drill',
        difficulty: 'intermediate'
    },
    {
        path: '../Audio_Cambridge_vocabulary_for_IELTS/Audio Cambridge vocabulary for IELTS',
        book: 'Cambridge Vocabulary for IELTS',
        type: 'vocabulary_pronunciation',
        difficulty: 'intermediate'
    }
];

/**
 * Scan directory and create metadata for all audio files
 */
async function scanAudioFiles() {
    const audioMetadata = [];
    let totalFiles = 0;

    for (const dir of AUDIO_DIRECTORIES) {
        console.log(`\n📂 Scanning: ${dir.book}`);

        try {
            const files = await fs.readdir(path.resolve(__dirname, dir.path));
            const audioFiles = files.filter(f =>
                f.endsWith('.mp3') || f.endsWith('.wma') || f.endsWith('.wav')
            );

            console.log(`   Found ${audioFiles.length} audio files`);

            for (const file of audioFiles) {
                // Extract track number from filename (e.g., "01.mp3" -> 1)
                const trackMatch = file.match(/(\d+)/);
                const trackNumber = trackMatch ? parseInt(trackMatch[1]) : 0;

                audioMetadata.push({
                    filename: file,
                    source_book: dir.book,
                    exercise_type: dir.type,
                    difficulty: dir.difficulty,
                    track_number: trackNumber,
                    storage_path: `${dir.book.replace(/\s+/g, '_')}/${file}`,
                    file_extension: path.extname(file).substring(1)
                });

                totalFiles++;
            }
        } catch (error) {
            console.error(`   ❌ Error scanning ${dir.book}:`, error.message);
        }
    }

    console.log(`\n✅ Total audio files indexed: ${totalFiles}`);
    return audioMetadata;
}

/**
 * Save metadata to JSON file for easy import
 */
async function saveMetadata(metadata) {
    const outputPath = path.resolve(__dirname, '../audio_metadata.json');
    await fs.writeFile(
        outputPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
    );
    console.log(`\n💾 Metadata saved to: audio_metadata.json`);
}

/**
 * Generate SQL INSERT statements for D1 database
 */
function generateSQLInserts(metadata) {
    const statements = metadata.map(audio => {
        return `INSERT INTO audio_files (filename, source_book, exercise_type, difficulty, storage_path) VALUES ('${audio.filename}', '${audio.source_book}', '${audio.exercise_type}', '${audio.difficulty}', '${audio.storage_path}');`;
    });

    return statements.join('\n');
}

/**
 * Main execution
 */
async function main() {
    console.log('🎵 Audio File Organization Script\n');

    const metadata = await scanAudioFiles();
    await saveMetadata(metadata);

    // Save SQL insert statements
    const sql = generateSQLInserts(metadata);
    await fs.writeFile(
        path.resolve(__dirname, '../audio_inserts.sql'),
        sql,
        'utf-8'
    );
    console.log('📝 SQL insert statements saved to: audio_inserts.sql');

    // Print summary by book
    const byBook = metadata.reduce((acc, audio) => {
        acc[audio.source_book] = (acc[audio.source_book] || 0) + 1;
        return acc;
    }, {});

    console.log('\n📊 Summary:');
    Object.entries(byBook).forEach(([book, count]) => {
        console.log(`   ${book}: ${count} files`);
    });
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { scanAudioFiles, saveMetadata, generateSQLInserts };
