/**
 * k6 Load Test: AI Grading Pipeline Latency Test
 * 
 * Measures "Time to Feedback" for AI grading
 * Acceptance Criteria:
 * - P95 latency < 8 seconds (if >8s, students drop off)
 * - Error rate < 2% (Gemini quota exhaustion must be handled gracefully)
 * 
 * Run: k6 run --config ../config/ramp-up-200.json grading-latency-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://babel-frontier.rahrus1977.workers.dev';
const USE_MOCK_AI = __ENV.USE_MOCK_AI === 'true';

// Custom metrics
const gradingLatency = new Trend('grading_latency', true);
const apiLatency = new Trend('api_response_time', true);
const errorRate = new Rate('errors');
const quotaExhaustion = new Counter('gemini_quota_errors');
const gradingErrors = new Counter('grading_errors');

// Load test configuration
export const options = {
    stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 200 },  // Daily peak
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
    ],
    thresholds: {
        'grading_latency': ['p(95)<8000'],     // 95% should get feedback within 8s
        'errors': ['rate<0.02'],                // <2% error rate
        'http_req_duration': ['p(95)<10000'],  // Total request time <10s
    },
};

// Pre-written essays for testing (avoid generating on the fly)
const TEST_ESSAYS = [
    {
        prompt: 'Some people think technology makes life easier. Others disagree. Discuss both views.',
        essay: 'Technology has changed our lives in many ways. Some people think it is good, others think it is bad. In my opinion, I think technology is helpful because we can communicate faster. For example, we can use mobile phones to talk to friends. However, some people say technology makes us lazy. They think we spend too much time on computers. I agree with this point too. In conclusion, technology has advantages and disadvantages.',
        expectedBand: 5.0
    },
    {
        prompt: 'Many cities face traffic congestion. What are the causes and solutions?',
        essay: 'Urban traffic congestion represents a multifaceted challenge requiring comprehensive interventions. The primary causative factors include inadequate public transportation infrastructure, excessive private vehicle ownership, and inefficient urban planning. To address these issues, municipalities should invest in integrated mass transit systems, implement congestion pricing mechanisms, and promote mixed-use development patterns that reduce commuting distances. Furthermore, incentivizing remote work arrangements and enhancing cycling infrastructure would alleviate peak-hour pressure on road networks.',
        expectedBand: 7.5
    },
    {
        prompt: 'Online shopping is replacing stores. Is this positive or negative?',
        essay: 'I think online shopping good. Many people buy things on internet now. Is convenient because no need go to shop. But some problem too. Cannot touch product before buy. Maybe picture not same as real thing. Also delivery take time. My opinion is online shopping has good and bad. People should choose what they want.',
        expectedBand: 4.0
    },
];

/**
 * Main test function
 */
export default function () {
    const testCase = TEST_ESSAYS[Math.floor(Math.random() * TEST_ESSAYS.length)];
    const userId = `grading_test_user_${__VU}`;
    const username = `tester_${__VU}`;

    const requestBody = {
        essay: testCase.essay,
        prompt: testCase.prompt,
        word_target: 250,
        user_id: userId,
        username: username
    };

    // Measure latency from request to response
    const startTime = Date.now();

    const response = http.post(
        `${BASE_URL}/api/writing-analysis`,
        JSON.stringify(requestBody),
        {
            headers: USE_MOCK_AI ? {
                'Content-Type': 'application/json',
                'X-Mock-AI': 'true'
            } : {
                'Content-Type': 'application/json'
            },
            timeout: '30s'
        }
    );

    const totalLatency = Date.now() - startTime;
    apiLatency.add(totalLatency);
    gradingLatency.add(totalLatency, { expected_band: testCase.expectedBand });

    // Detailed validation
    const success = check(response, {
        'status is 200': (r) => r.status === 200,
        'response time < 10s': (r) => totalLatency < 10000,
        'has band_score': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.band_score !== undefined;
            } catch (e) {
                return false;
            }
        },
        'has task_achievement': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.task_achievement !== undefined;
            } catch (e) {
                return false;
            }
        },
        'has coherence': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.coherence !== undefined;
            } catch (e) {
                return false;
            }
        },
        'has vocabulary': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.vocabulary !== undefined;
            } catch (e) {
                return false;
            }
        },
        'has grammar': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.grammar !== undefined;
            } catch (e) {
                return false;
            }
        },
        'has feedback': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.feedback !== undefined && body.feedback.length > 0;
            } catch (e) {
                return false;
            }
        },
        'band score in valid range': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.band_score >= 3.0 && body.band_score <= 9.0;
            } catch (e) {
                return false;
            }
        },
    });

    // Error handling
    if (!success) {
        errorRate.add(1);
        gradingErrors.add(1);

        // Check for quota exhaustion
        if (response.status === 429 || (response.body && response.body.includes('quota'))) {
            quotaExhaustion.add(1);
            console.error(`Gemini quota exhausted at ${Date.now()}`);
        } else {
            console.error(`Grading failed: ${response.status} - ${response.body ? response.body.substring(0, 200) : 'No body'}`);
        }
    } else {
        errorRate.add(0);

        // Validate pedagogical quality
        try {
            const body = JSON.parse(response.body);

            // Check if band score is reasonable for the essay quality
            const actualBand = body.band_score;
            const expectedBand = testCase.expectedBand;
            const tolerance = 1.0; // Allow ±1.0 band difference

            if (Math.abs(actualBand - expectedBand) > tolerance) {
                console.warn(`Band score mismatch: expected ~${expectedBand}, got ${actualBand}`);
                console.warn(`Essay preview: ${testCase.essay.substring(0, 100)}...`);
            }

            // Log if latency is concerning (>8s = drop-off risk)
            if (totalLatency > 8000) {
                console.warn(`High latency detected: ${totalLatency}ms - Risk of user drop-off!`);
            }

            // Check for all 4 IELTS criteria
            const hasCriteria = body.task_achievement && body.coherence && body.vocabulary && body.grammar;
            if (!hasCriteria) {
                console.warn('Incomplete IELTS criteria in response');
                gradingErrors.add(1);
            }

        } catch (e) {
            console.error(`Failed to parse response for validation: ${e.message}`);
        }
    }

    // Realistic pause between submissions
    sleep(randomBetween(5, 15));
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

export function setup() {
    console.log('========================================');
    console.log('AI Grading Pipeline Latency Test');
    console.log(`Target URL: ${BASE_URL}`);
    console.log(`Mock AI: ${USE_MOCK_AI}`);
    console.log('Testing "Time to Feedback" for IELTS writing grading');
    console.log('Target: P95 < 8 seconds');
    console.log('========================================');
}

export function teardown(data) {
    console.log('========================================');
    console.log('Test Complete!');
    console.log('Key Metrics:');
    console.log('- Check grading_latency P95 (should be <8000ms)');
    console.log('- Check errors rate (should be <2%)');
    console.log('- Check gemini_quota_errors counter');
    console.log('========================================');
}
