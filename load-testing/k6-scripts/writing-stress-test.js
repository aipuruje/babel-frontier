/**
 * k6 Load Test: Writing Foundry Auto-Save Stress Test
 * 
 * Tests the /api/writing/analyze-realtime and /api/writing/submit endpoints
 * Simulates progressive essay writing with auto-save every 10 seconds
 * 
 * CRITICAL TEST: 500 users × auto-save every 10s = ~50 concurrent writes to D1
 * Will D1 lock? Will latency spike above 500ms (UX failure)?
 * 
 * Run: k6 run --config ../config/ramp-up-500.json writing-stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://babel-frontier.rahrus1977.workers.dev';
const USE_MOCK_AI = __ENV.USE_MOCK_AI === 'true';

// Custom metrics
const autoSaveLatency = new Trend('auto_save_latency', true);
const finalSubmissionLatency = new Trend('final_submission_latency', true);
const dbConcurrentWrites = new Counter('db_concurrent_writes');
const errorRate = new Rate('errors');
const templateDetected = new Counter('template_essays_detected');

// Load test configuration
export const options = {
    stages: [
        { duration: '2m', target: 100 },
        { duration: '3m', target: 300 },
        { duration: '3m', target: 500 },  // Peak stress
        { duration: '2m', target: 0 },
    ],
    thresholds: {
        'auto_save_latency': ['p(95)<1000'],         // Auto-save should be <1s
        'final_submission_latency': ['p(95)<5000'],  // Final grading <5s
        'errors': ['rate<0.2'],                      // Allow 20% error rate at peak
    },
};

const ESSAY_PROMPTS = [
    'Some people believe that technology has made our lives easier. Others think it has made life more complicated. Discuss both views and give your opinion.',
    'Many cities are experiencing traffic congestion. What are the causes and what solutions can you suggest?',
    'Online shopping is replacing traditional shopping. Do the advantages outweigh the disadvantages?'
];

/**
 * Main test function - simulates a full writing session
 */
export default function () {
    const persona = selectRandomPersona();
    const prompt = ESSAY_PROMPTS[Math.floor(Math.random() * ESSAY_PROMPTS.length)];

    const userId = `test_user_${__VU}`;
    const username = `${persona.name.replace(' ', '_')}_${__VU}`;

    // Generate full essay based on persona
    const fullEssay = generateEssay(persona, prompt);
    const words = fullEssay.split(/\s+/);
    const targetWordCount = words.length;

    // Simulate progressive writing with auto-saves
    const autoSaveInterval = getAutoSaveInterval(persona);
    const numAutoSaves = Math.floor(targetWordCount / (persona.typingSpeed / 6)); // Every ~10 words

    let currentWordIndex = 0;
    const wordsPerSave = Math.floor(targetWordCount / numAutoSaves);

    // Simulate writing session with periodic auto-saves
    for (let i = 0; i < numAutoSaves; i++) {
        currentWordIndex += wordsPerSave;
        const partialEssay = words.slice(0, currentWordIndex).join(' ');

        // Auto-save request
        const autoSaveStart = Date.now();
        const response = http.post(
            `${BASE_URL}/api/writing/analyze-realtime`,
            JSON.stringify({
                text: partialEssay,
                user_id: userId
            }),
            {
                headers: USE_MOCK_AI ? {
                    'Content-Type': 'application/json',
                    'X-Mock-AI': 'true'
                } : {
                    'Content-Type': 'application/json'
                },
                timeout: '10s'
            }
        );

        const autoSaveTime = Date.now() - autoSaveStart;
        autoSaveLatency.add(autoSaveTime, { persona: persona.name });
        dbConcurrentWrites.add(1);

        const success = check(response, {
            'auto-save status 200': (r) => r.status === 200,
            'auto-save latency <2s': (r) => r.timings.duration < 2000,
        });

        if (!success) {
            errorRate.add(1);

            // Silent warriors quit on errors
            if (persona.name === 'Silent Warrior') {
                console.warn(`Silent Warrior ${userId} quit due to auto-save failure`);
                return;
            }
        } else {
            errorRate.add(0);
        }

        // Wait before next auto-save (simulates typing time)
        sleep(autoSaveInterval / 1000);

        // Chaos agents might abandon mid-session
        if (persona.name === 'Chaos Agent' && Math.random() < 0.3) {
            console.log(`Chaos Agent ${userId} abandoned essay`);
            return;
        }
    }

    // Final submission
    const finalStart = Date.now();
    const finalResponse = http.post(
        `${BASE_URL}/api/writing/submit`,
        JSON.stringify({
            essay: fullEssay,
            prompt: prompt,
            word_target: 250,
            user_id: userId,
            username: username
        }),
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

    const finalTime = Date.now() - finalStart;
    finalSubmissionLatency.add(finalTime, { persona: persona.name });

    const finalSuccess = check(finalResponse, {
        'submit status 200': (r) => r.status === 200,
        'has band_score': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.band_score !== undefined;
            } catch (e) {
                return false;
            }
        },
        'has all 4 IELTS criteria': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.task_achievement && body.coherence && body.vocabulary && body.grammar;
            } catch (e) {
                return false;
            }
        },
    });

    if (!finalSuccess) {
        errorRate.add(1);
        console.error(`Final submission failed for ${persona.name}: ${finalResponse.status}`);
    } else {
        errorRate.add(0);

        // Check if template was detected
        if (persona.name === 'Template Trapped') {
            try {
                const body = JSON.parse(finalResponse.body);
                // If band score is low despite "competent user" status, template was likely detected
                if (body.band_score < 5.5) {
                    templateDetected.add(1);
                }
            } catch (e) { }
        }
    }

    // Pause before next session
    sleep(randomBetween(3, 8));
}

// Persona definitions
const PERSONAS = {
    SILENT_WARRIOR: {
        name: 'Silent Warrior',
        bandRange: [3.5, 4.5],
        wordCount: [100, 180],
        typingSpeed: 20
    },
    TEMPLATE_TRAPPED: {
        name: 'Template Trapped',
        bandRange: [5.5, 6.0],
        wordCount: [200, 250],
        typingSpeed: 40,
        templates: [
            'In my humble opinion, this is a controversial issue.',
            'It goes without saying that this topic has both advantages and disadvantages.',
            'Last but not least, I would like to say that'
        ]
    },
    SAMARKAND_SCHOLAR: {
        name: 'Samarkand Scholar',
        bandRange: [6.5, 8.5],
        wordCount: [280, 320],
        typingSpeed: 60
    },
    CHAOS_AGENT: {
        name: 'Chaos Agent',
        bandRange: [3.0, 9.0],
        wordCount: [10, 400],
        typingSpeed: 100
    }
};

function selectRandomPersona() {
    const rand = Math.random();
    if (rand < 0.40) return PERSONAS.SILENT_WARRIOR;
    if (rand < 0.70) return PERSONAS.TEMPLATE_TRAPPED;
    if (rand < 0.90) return PERSONAS.SAMARKAND_SCHOLAR;
    return PERSONAS.CHAOS_AGENT;
}

function generateEssay(persona, prompt) {
    const targetWords = randomBetween(persona.wordCount[0], persona.wordCount[1]);

    if (persona.name === 'Template Trapped') {
        let essay = persona.templates[0] + ' ';
        essay += generateBasicSentences(targetWords - 40);
        essay += ' ' + persona.templates[2];
        return essay;
    }

    if (persona.name === 'Samarkand Scholar') {
        return generateAdvancedEssay(targetWords);
    }

    if (persona.name === 'Chaos Agent') {
        return generateGibberish(targetWords);
    }

    // Silent Warrior - basic essay
    return generateBasicSentences(targetWords);
}

function generateBasicSentences(targetWords) {
    const sentences = [
        'I think this is important topic.',
        'Many people have opinion about this.',
        'In my country we see this problem.',
        'Some people say yes but other say no.',
        'For example my friend do this.',
        'This is difficult sometimes.',
        'In conclusion I think we must think.'
    ];

    let essay = '';
    while (essay.split(/\s+/).length < targetWords) {
        essay += sentences[Math.floor(Math.random() * sentences.length)] + ' ';
    }
    return essay.trim();
}

function generateAdvancedEssay(targetWords) {
    const sentences = [
        'Contemporary discourse reveals multifaceted perspectives on this matter.',
        'Empirical research suggests this phenomenon warrants careful consideration.',
        'While proponents advocate implementation, critics raise sustainability concerns.',
        'The ramifications extend beyond superficial economic indicators.',
        'Cross-cultural analysis demonstrates significant variation in outcomes.'
    ];

    let essay = '';
    while (essay.split(/\s+/).length < targetWords) {
        essay += sentences[Math.floor(Math.random() * sentences.length)] + ' ';
    }
    return essay.trim();
}

function generateGibberish(targetWords) {
    const words = 'asdf qwer zxcv lkjh poiu mnbv tyui fghj'.split(' ');
    let essay = '';
    for (let i = 0; i < targetWords; i++) {
        essay += words[Math.floor(Math.random() * words.length)] + ' ';
    }
    return essay.trim();
}

function getAutoSaveInterval(persona) {
    if (persona.name === 'Silent Warrior') return 15;
    if (persona.name === 'Samarkand Scholar') return 8;
    if (persona.name === 'Chaos Agent') return randomBetween(3, 20);
    return 10;
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

export function setup() {
    console.log('========================================');
    console.log('Writing Foundry Auto-Save Stress Test');
    console.log(`Target URL: ${BASE_URL}`);
    console.log(`Mock AI: ${USE_MOCK_AI}`);
    console.log('Simulating progressive essay writing with auto-save');
    console.log('========================================');
}
