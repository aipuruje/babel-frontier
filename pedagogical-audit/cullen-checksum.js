/**
 * Cullen Checksum - Pedagogical Quality Validator
 * 
 * Validates AI grading against Pauline Cullen's IELTS standards
 * Tests known-quality essays to ensure the AI maintains pedagogical integrity
 * 
 * Run: node pedagogical-audit/cullen-checksum.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://babel-frontier.rahrus1977.workers.dev';
const TOLERANCE = 1.0; // Allow ±1.0 band score difference
const USE_MOCK_AI = process.env.USE_MOCK_AI === 'true';

// Load test data
const weakEssays = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-data', 'weak-essays.json'), 'utf8'));
const strongEssays = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-data', 'strong-essays.json'), 'utf8'));
const templateEssays = JSON.parse(fs.readFileSync(path.join(__dirname, 'test-data', 'template-essays.json'), 'utf8'));

/**
 * Main validation function
 */
async function runCullenChecksum() {
    console.log('========================================');
    console.log('CULLEN CHECKSUM - Pedagogical Validator');
    console.log('========================================\n');

    const results = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        summary: {
            totalTests: 0,
            passed: 0,
            failed: 0,
            passRate: 0
        },
        weakEssays: [],
        strongEssays: [],
        templateEssays: [],
        pedagogicalDrift: []
    };

    // Test weak essays (should receive Band ≤ 5.5)
    console.log('Testing WEAK essays (Band 3.5-5.5)...\n');
    for (const essay of weakEssays) {
        const result = await testEssay(essay, 'weak');
        results.weakEssays.push(result);
        results.totalTests++;

        if (result.passed) {
            results.passed++;
            console.log(`✓ PASS: ${essay.band} essay graded as ${result.actualBand}`);
        } else {
            results.failed++;
            console.log(`✗ FAIL: ${essay.band} essay graded as ${result.actualBand} (expected ≤ ${essay.band + TOLERANCE})`);
            results.pedagogicalDrift.push({
                type: 'grade_inflation',
                expected: essay.band,
                actual: result.actualBand,
                essay: essay.essay.substring(0, 100) + '...'
            });
        }
    }

    console.log('\n');

    // Test strong essays (should receive Band ≥ 7.0)
    console.log('Testing STRONG essays (Band 7.0-8.5)...\n');
    for (const essay of strongEssays) {
        const result = await testEssay(essay, 'strong');
        results.strongEssays.push(result);
        results.totalTests++;

        if (result.passed) {
            results.passed++;
            console.log(`✓ PASS: ${essay.band} essay graded as ${result.actualBand}`);
        } else {
            results.failed++;
            console.log(`✗ FAIL: ${essay.band} essay graded as ${result.actualBand} (expected ≥ ${essay.band - TOLERANCE})`);
            results.pedagogicalDrift.push({
                type: 'grade_deflation',
                expected: essay.band,
                actual: result.actualBand,
                essay: essay.essay.substring(0, 100) + '...'
            });
        }
    }

    console.log('\n');

    // Test template essays (should be penalized)
    console.log('Testing TEMPLATE essays (should detect memorized phrases)...\n');
    for (const essay of templateEssays) {
        const result = await testEssay(essay, 'template');
        results.templateEssays.push(result);
        results.totalTests++;

        // Template essays should be graded lower than claimed band
        const shouldBePenalized = result.actualBand < essay.band;

        if (shouldBePenalized) {
            results.passed++;
            console.log(`✓ PASS: Template essay penalized (${essay.band} → ${result.actualBand})`);
        } else {
            results.failed++;
            console.log(`✗ FAIL: Template essay NOT penalized (still graded as ${result.actualBand})`);
            results.pedagogicalDrift.push({
                type: 'template_not_detected',
                expected: '< ' + essay.band,
                actual: result.actualBand,
                templates: essay.templatePhrases,
                essay: essay.essay.substring(0, 100) + '...'
            });
        }
    }

    // Calculate pass rate
    results.summary.passRate = (results.passed / results.totalTests * 100).toFixed(2);

    // Print summary
    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`Total Tests: ${results.totalTests}`);
    console.log(`Passed: ${results.passed} (${results.summary.passRate}%)`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Pedagogical Drift Incidents: ${results.pedagogicalDrift.length}`);

    if (results.summary.passRate >= 80) {
        console.log('\n✓ OVERALL: PASSED - AI grading meets Cullen standards');
    } else {
        console.log('\n✗ OVERALL: FAILED - Pedagogical drift detected');
        console.log('\nDrift incidents:');
        results.pedagogicalDrift.forEach((drift, i) => {
            console.log(`${i + 1}. ${drift.type}: Expected ${drift.expected}, got ${drift.actual}`);
        });
    }

    // Save report
    const reportPath = path.join(__dirname, '../reports', 'cullen_checksum_report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);
}

/**
 * Test a single essay
 */
async function testEssay(essay, type) {
    try {
        const requestBody = {
            essay: essay.essay,
            prompt: essay.prompt,
            word_target: 250
        };

        const headers = {
            'Content-Type': 'application/json',
            ...(USE_MOCK_AI && { 'X-Mock-AI': 'true' })
        };

        const response = await fetch(`${BASE_URL}/api/writing-analysis`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        const actualBand = data.band_score || 0;

        let passed = false;

        if (type === 'weak') {
            // Weak essays should be graded ≤ expectedBand + tolerance
            passed = actualBand <= (essay.band + TOLERANCE);
        } else if (type === 'strong') {
            // Strong essays should be graded ≥ expectedBand - tolerance
            passed = actualBand >= (essay.band - TOLERANCE);
        } else if (type === 'template') {
            // Template essays should be penalized (actual < claimed band)
            passed = actualBand < essay.band;
        }

        return {
            expectedBand: essay.band,
            actualBand,
            passed,
            feedback: data.feedback,
            criteria: {
                taskAchievement: data.task_achievement,
                coherence: data.coherence,
                vocabulary: data.vocabulary,
                grammar: data.grammar
            }
        };

    } catch (error) {
        console.error(`Error testing essay: ${error.message}`);
        return {
            expectedBand: essay.band,
            actualBand: 0,
            passed: false,
            error: error.message
        };
    }
}

// Run the checksum
runCullenChecksum().catch(console.error);
