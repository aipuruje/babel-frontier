/**
 * k6 Load Test: Speaking Mission Stress Test
 * 
 * Tests the /api/speech-analysis endpoint under concurrent load
 * Simulates 4 user personas with different speaking patterns
 * 
 * Run: k6 run --config ../config/ramp-up-50.json speaking-stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// Import persona behaviors (note: adjust path based on k6's module resolution)
const PERSONAS = {
    SILENT_WARRIOR: { name: 'Silent Warrior', bandRange: [3.5, 4.5], duration: [5, 10] },
    TEMPLATE_TRAPPED: { name: 'Template Trapped', bandRange: [5.5, 6.0], duration: [15, 20] },
    SAMARKAND_SCHOLAR: { name: 'Samarkand Scholar', bandRange: [6.5, 8.5], duration: [25, 35] },
    CHAOS_AGENT: { name: 'Chaos Agent', bandRange: [3.0, 9.0], duration: [3, 40] }
};

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://babel-frontier.rahrus1977.workers.dev';
const USE_MOCK_AI = __ENV.USE_MOCK_AI === 'true'; // Set to 'true' to avoid hitting Gemini rate limits

// Custom metrics
const geminiLatency = new Trend('gemini_transcription_time', true);
const dbWriteLatency = new Trend('db_write_time', true);
const errorRate = new Rate('errors');
const apiErrors = new Counter('api_errors');
const personaDistribution = new Counter('persona_usage');

// Load test configuration (can be overridden by --config flag)
export const options = {
    stages: [
        { duration: '1m', target: 10 },  // Ramp up to 10 users
        { duration: '2m', target: 50 },  // Ramp up to 50 users
        { duration: '2m', target: 50 },  // Stay at 50 users
        { duration: '1m', target: 0 },   // Ramp down
    ],
    thresholds: {
        'http_req_duration': ['p(95)<5000'], // 95% of requests should be below 5s
        'errors': ['rate<0.1'],              // Error rate should be below 10%
        'gemini_transcription_time': ['p(95)<3000'], // Gemini should respond within 3s
    },
};

/**
 * Main test function - runs for each virtual user
 */
export default function () {
    // Select random persona based on distribution
    const persona = selectRandomPersona();
    personaDistribution.add(1, { persona: persona.name });

    // Generate behavior for this persona
    const behavior = generateSpeakingBehavior(persona);

    // Create mock audio file
    const audioData = generateMockAudioBlob(behavior.duration);

    // Generate random user ID for this VU
    const userId = `test_user_${__VU}_${Date.now()}`;
    const username = `${persona.name.replace(' ', '_')}_${__VU}`;

    // Prepare multipart form data
    const formData = {
        audio: http.file(audioData, `audio-${behavior.duration}s.webm`, 'audio/webm'),
        user_id: userId,
        username: username,
    };

    // If using mock AI, add header to bypass Gemini
    const headers = USE_MOCK_AI ? { 'X-Mock-AI': 'true' } : {};

    // Start timer for full request
    const startTime = Date.now();

    // Send POST request to speaking analysis endpoint
    const response = http.post(
        `${BASE_URL}/api/speech-analysis`,
        formData,
        { headers, timeout: '30s' }
    );

    const totalLatency = Date.now() - startTime;

    // Validate response
    const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'has transcription': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.transcription !== undefined;
            } catch (e) {
                return false;
            }
        },
        'has band_score': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.band_score !== undefined && body.band_score >= 3.0 && body.band_score <= 9.0;
            } catch (e) {
                return false;
            }
        },
        'has damage': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.damage !== undefined;
            } catch (e) {
                return false;
            }
        },
        'response time < 10s': (r) => r.timings.duration < 10000,
    });

    // Record metrics
    if (!success) {
        errorRate.add(1);
        apiErrors.add(1, { persona: persona.name });
        console.error(`Request failed for ${persona.name}: ${response.status} - ${response.body}`);
    } else {
        errorRate.add(0);

        // Parse response to extract detailed metrics
        try {
            const body = JSON.parse(response.body);

            // Estimate Gemini latency (total time - network overhead)
            const estimatedGeminiTime = totalLatency * 0.85; // Rough estimate
            geminiLatency.add(estimatedGeminiTime, { persona: persona.name });

            // DB write is typically fast (<100ms)
            const estimatedDBTime = totalLatency * 0.05;
            dbWriteLatency.add(estimatedDBTime);

            // Log band score for validation (should match persona range)
            if (body.band_score < persona.bandRange[0] || body.band_score > persona.bandRange[1]) {
                console.warn(`Band score ${body.band_score} outside expected range ${persona.bandRange} for ${persona.name}`);
            }
        } catch (e) {
            console.error(`Failed to parse response: ${e.message}`);
        }
    }

    // Simulate realistic user behavior - pause between requests
    // Silent warriors quit faster on errors
    if (persona.name === 'Silent Warrior' && !success) {
        sleep(1); // Quick exit
    } else {
        sleep(randomBetween(2, 5)); // Normal pause between speaking missions
    }
}

/**
 * Select random persona based on realistic distribution
 */
function selectRandomPersona() {
    const rand = Math.random();

    if (rand < 0.40) return PERSONAS.SILENT_WARRIOR;
    if (rand < 0.70) return PERSONAS.TEMPLATE_TRAPPED;
    if (rand < 0.90) return PERSONAS.SAMARKAND_SCHOLAR;
    return PERSONAS.CHAOS_AGENT;
}

/**
 * Generate speaking behavior metadata
 */
function generateSpeakingBehavior(persona) {
    const duration = randomBetween(persona.duration[0], persona.duration[1]);

    return {
        duration: Math.floor(duration),
        expectedBand: randomBetween(persona.bandRange[0], persona.bandRange[1]),
    };
}

/**
 * Generate a mock audio blob (simplified for k6)
 */
function generateMockAudioBlob(durationSeconds) {
    // Approximate file size: 32 kbps WebM Opus
    const fileSizeBytes = Math.floor((32000 / 8) * durationSeconds);

    // Create random binary data
    const bytes = new Uint8Array(fileSizeBytes);
    for (let i = 0; i < fileSizeBytes; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
    }

    return bytes;
}

/**
 * Helper: Random number between min and max
 */
function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Setup function - runs once before the test starts
 */
export function setup() {
    console.log('========================================');
    console.log('Speaking Mission Stress Test');
    console.log(`Target URL: ${BASE_URL}`);
    console.log(`Mock AI: ${USE_MOCK_AI}`);
    console.log('Persona Distribution: 40% Silent Warrior, 30% Template Trapped, 20% Samarkand Scholar, 10% Chaos Agent');
    console.log('========================================');
}

/**
 * Teardown function - runs once after the test completes
 */
export function teardown(data) {
    console.log('========================================');
    console.log('Test Complete!');
    console.log('Check the metrics above for performance analysis.');
    console.log('========================================');
}
