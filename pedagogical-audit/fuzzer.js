/**
 * AI Grading Fuzzer
 * 
 * Stress-tests the AI grading endpoint with malicious/nonsense inputs
 * Ensures the system handles edge cases gracefully without crashing
 * 
 * Run: node pedagogical-audit/fuzzer.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'https://babel-frontier.rahrus1977.workers.dev';
const USE_MOCK_AI = process.env.USE_MOCK_AI === 'true';

// Fuzzing test cases
const FUZZ_TESTS = [
    {
        name: 'Empty text',
        essay: '',
        expectedBehavior: 'Should return error or very low band score',
        maxAcceptableBand: 3.5
    },
    {
        name: 'Single word',
        essay: 'Hello',
        expectedBehavior: 'Should return Band ≤ 3.5',
        maxAcceptableBand: 3.5
    },
    {
        name: 'Gibberish text',
        essay: 'asdfkljasdf klajsdf lkajsdf qwpoieur zxcvbnm mnbvcxz lkjhgfdsa poiuytrewq',
        expectedBehavior: 'Should return Band ≤ 4.0',
        maxAcceptableBand: 4.0
    },
    {
        name: 'Repeated word spam',
        essay: 'good good good good good good good good good good good good good good good good good good good good good good good good good good good good good good',
        expectedBehavior: 'Should detect repetition and penalize',
        maxAcceptableBand: 4.0
    },
    {
        name: 'Only punctuation',
        essay: '........ !!!!! ????? ,,,,,, ;;;;; ::::',
        expectedBehavior: 'Should return error or Band 3.0',
        maxAcceptableBand: 3.0
    },
    {
        name: 'Numbers only',
        essay: '123 456 789 101112 131415 161718 192021 222324',
        expectedBehavior: 'Should return error or very low band',
        maxAcceptableBand: 3.5
    },
    {
        name: 'Unicode spam (emojis)',
        essay: '😀😎🔥💀👑⚡🎮🏆 😀😎🔥💀👑⚡🎮🏆 😀😎🔥💀👑⚡🎮🏆 😀😎🔥💀👑⚡🎮🏆',
        expectedBehavior: 'Should handle gracefully, low band score',
        maxAcceptableBand: 3.5
    },
    {
        name: 'Exact template repetition',
        essay: 'In my humble opinion, this is a controversial issue. In my humble opinion, this is a controversial issue. In my humble opinion, this is a controversial issue. In my humble opinion, this is a controversial issue. In my humble opinion, this is a controversial issue. In my humble opinion, this is a controversial issue. In my humble opinion, this is a controversial issue.',
        expectedBehavior: 'Should detect exact repetition',
        maxAcceptableBand: 4.5
    },
    {
        name: 'Mixed Cyrillic and Latin',
        essay: 'This is английский language but Узбекча mixed together without sense или meaning для essay.',
        expectedBehavior: 'Should handle mixed scripts',
        maxAcceptableBand: 5.0
    },
    {
        name: 'Extremely long run-on sentence',
        essay: 'I think that technology is good because we can use computers and phones and internet and social media and email and messaging apps and video calls and online shopping and streaming services and navigation apps and many other things that make our life easier and more convenient and connected to other people around the world and we can learn new things and communicate faster and work remotely and access information instantly and share photos and videos and play games and listen to music and watch movies and read books and do research and stay informed about news and events and connect with friends and family and meet new people and express our opinions and ideas.',
        expectedBehavior: 'Should penalize for lack of punctuation',
        maxAcceptableBand: 5.5
    },
    {
        name: 'SQL injection attempt',
        essay: "'; DROP TABLE users; -- Some people think technology is good",
        expectedBehavior: 'Should sanitize input, not crash',
        maxAcceptableBand: 4.0
    },
    {
        name: 'HTML/Script injection',
        essay: '<script>alert("XSS")</script> Technology has changed our lives in many ways.',
        expectedBehavior: 'Should strip/escape HTML',
        maxAcceptableBand: 4.5
    },
    {
        name: 'Extremely short (incomplete task)',
        essay: 'Technology good. I like.',
        expectedBehavior: 'Should penalize for inadequate response',
        maxAcceptableBand: 3.5
    },
    {
        name: 'Off-topic response',
        prompt: 'Discuss the advantages and disadvantages of public transportation.',
        essay: 'My favorite food is pizza. I like to eat pizza every weekend with my friends. Pizza is delicious and comes in many varieties. You can have pepperoni, cheese, vegetable, or Hawaiian pizza. I usually order from the local pizzeria near my house.',
        expectedBehavior: 'Should penalize for off-topic (low Task Achievement)',
        maxAcceptableBand: 4.5
    },
    {
        name: 'Question as answer',
        essay: 'What is technology? What are the advantages? What are the disadvantages? How does it affect us? What should we do? What is the solution? Why is this important?',
        expectedBehavior: 'Should penalize for not providing statements',
        maxAcceptableBand: 4.0
    }
];

async function runFuzzer() {
    console.log('========================================');
    console.log('AI GRADING FUZZER - Edge Case Testing');
    console.log('========================================\n');

    const results = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        summary: {
            totalTests: FUZZ_TESTS.length,
            passed: 0,
            failed: 0,
            crashed: 0
        },
        testResults: []
    };

    for (const test of FUZZ_TESTS) {
        console.log(`Testing: ${test.name}`);

        try {
            const requestBody = {
                essay: test.essay,
                prompt: test.prompt || 'Discuss both views and give your opinion.',
                word_target: 250
            };

            const response = await fetch(`${BASE_URL}/api/writing-analysis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(USE_MOCK_AI && { 'X-Mock-AI': 'true' })
                },
                body: JSON.stringify(requestBody),
                timeout: 15000
            });

            const responseText = await response.text();

            let testResult = {
                testName: test.name,
                input: test.essay.substring(0, 100) + (test.essay.length > 100 ? '...' : ''),
                status: response.status,
                crashed: false,
                passed: false
            };

            if (response.ok) {
                try {
                    const data = JSON.parse(responseText);
                    const bandScore = data.band_score || 0;

                    testResult.bandScore = bandScore;
                    testResult.feedback = data.feedback ? data.feedback.substring(0, 100) : 'No feedback';

                    // Check if band score is appropriate
                    if (bandScore <= test.maxAcceptableBand) {
                        testResult.passed = true;
                        results.summary.passed++;
                        console.log(`  ✓ PASS: Returned Band ${bandScore} (expected ≤ ${test.maxAcceptableBand})`);
                    } else {
                        results.summary.failed++;
                        console.log(`  ✗ FAIL: Returned Band ${bandScore} (expected ≤ ${test.maxAcceptableBand})`);
                    }

                } catch (parseError) {
                    // Could not parse JSON
                    testResult.error = 'Invalid JSON response';
                    testResult.response = responseText.substring(0, 200);
                    results.summary.failed++;
                    console.log(`  ✗ FAIL: Invalid JSON response`);
                }
            } else {
                // Non-200 response - check if it's graceful error handling
                testResult.error = `HTTP ${response.status}`;
                testResult.response = responseText.substring(0, 200);

                // For edge cases, graceful errors are acceptable
                if (response.status === 400 || response.status === 422) {
                    testResult.passed = true;
                    results.summary.passed++;
                    console.log(`  ✓ PASS: Graceful error handling (${response.status})`);
                } else {
                    results.summary.failed++;
                    console.log(`  ✗ FAIL: Unexpected error (${response.status})`);
                }
            }

            results.testResults.push(testResult);

        } catch (error) {
            // System crash or timeout
            console.log(`  ✗ CRASH: ${error.message}`);
            results.summary.crashed++;
            results.testResults.push({
                testName: test.name,
                input: test.essay.substring(0, 100),
                crashed: true,
                error: error.message
            });
        }

        console.log('');
    }

    // Print summary
    console.log('========================================');
    console.log('SUMMARY');
    console.log('========================================');
    console.log(`Total Tests: ${results.summary.totalTests}`);
    console.log(`Passed: ${results.summary.passed}`);
    console.log(`Failed: ${results.summary.failed}`);
    console.log(`Crashed: ${results.summary.crashed}`);

    const passRate = (results.summary.passed / results.summary.totalTests * 100).toFixed(2);
    console.log(`Pass Rate: ${passRate}%`);

    if (results.summary.crashed > 0) {
        console.log('\n✗ CRITICAL: System crashed on some inputs!');
    } else if (passRate >= 80) {
        console.log('\n✓ OVERALL: PASSED - AI handles edge cases gracefully');
    } else {
        console.log('\n✗ OVERALL: FAILED - AI does not adequately handle edge cases');
    }

    // Save report
    const reportPath = path.join(__dirname, '../reports', 'fuzzer_report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);
}

runFuzzer().catch(console.error);
