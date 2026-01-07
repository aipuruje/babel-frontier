/**
 * Persona Behavior Definitions for Load Testing
 * 
 * These personas simulate the 4 distinct user types in the Uzbekistan IELTS market:
 * 1. Silent Warrior (40%) - High gaming skill, low English fluency
 * 2. Template Trapped (30%) - Uses memorized sentences
 * 3. Samarkand Scholar (20%) - High motivation, Band 8.0+ target
 * 4. Chaos Agent (10%) - Random inputs, simulates poor connectivity
 */

export const PERSONAS = {
    SILENT_WARRIOR: {
        name: 'Silent Warrior',
        bandRange: [3.5, 4.5],
        speakingDuration: [5, 10], // seconds
        writingWordCount: [100, 180],
        pauseRate: 'high', // Frequent pauses during speaking
        vocabularyLevel: 'basic',
        grammarErrors: 'frequent',
        quitOnComplexity: true, // Exits if instructions are too academic
        typingSpeed: 20 // words per minute
    },

    TEMPLATE_TRAPPED: {
        name: 'Template Trapped',
        bandRange: [5.5, 6.0],
        speakingDuration: [15, 20],
        writingWordCount: [200, 250],
        pauseRate: 'medium',
        vocabularyLevel: 'memorized', // Uses fixed phrases
        grammarErrors: 'moderate',
        templates: [
            'In my humble opinion, this is a controversial issue.',
            'It goes without saying that this topic has both advantages and disadvantages.',
            'On the one hand... On the other hand...',
            'Last but not least, I would like to say that...'
        ],
        typingSpeed: 40
    },

    SAMARKAND_SCHOLAR: {
        name: 'Samarkand Scholar',
        bandRange: [6.5, 8.5],
        speakingDuration: [25, 35],
        writingWordCount: [280, 320],
        pauseRate: 'low',
        vocabularyLevel: 'advanced',
        grammarErrors: 'minimal',
        complexSentences: true,
        typingSpeed: 60
    },

    CHAOS_AGENT: {
        name: 'Chaos Agent',
        bandRange: [3.0, 9.0], // Random
        speakingDuration: [3, 40], // Highly variable
        writingWordCount: [10, 400], // Chaotic range
        pauseRate: 'random',
        vocabularyLevel: 'gibberish',
        grammarErrors: 'severe',
        behavior: 'random', // Clicks buttons rapidly, submits incomplete work
        networkLatency: [1000, 5000], // Simulates poor 4G
        packetLoss: 0.05, // 5% packet loss
        typingSpeed: 100 // Very fast, random typing
    }
};

/**
 * Generate speaking audio metadata based on persona
 */
export function generateSpeakingBehavior(persona) {
    const config = PERSONAS[persona];
    const duration = randomBetween(config.speakingDuration[0], config.speakingDuration[1]);
    const wordCount = Math.floor(duration * 2.5); // Rough estimate: 2.5 words/second

    let pauseCount;
    switch (config.pauseRate) {
        case 'high':
            pauseCount = Math.floor(duration / 3); // Pause every 3 seconds
            break;
        case 'medium':
            pauseCount = Math.floor(duration / 6);
            break;
        case 'low':
            pauseCount = Math.floor(duration / 12);
            break;
        case 'random':
            pauseCount = Math.floor(Math.random() * duration);
            break;
    }

    return {
        duration,
        wordCount,
        pauseCount,
        expectedBand: randomBetween(config.bandRange[0], config.bandRange[1])
    };
}

/**
 * Generate writing essay text based on persona
 */
export function generateWritingBehavior(persona, prompt) {
    const config = PERSONAS[persona];
    const targetWords = randomBetween(config.writingWordCount[0], config.writingWordCount[1]);

    let essayText = '';

    switch (persona) {
        case 'SILENT_WARRIOR':
            // Basic vocabulary, short sentences, grammatical errors
            essayText = generateBasicEssay(prompt, targetWords);
            break;

        case 'TEMPLATE_TRAPPED':
            // Mix templates with basic content
            essayText = generateTemplateEssay(prompt, targetWords, config.templates);
            break;

        case 'SAMARKAND_SCHOLAR':
            // Advanced vocabulary, complex sentences
            essayText = generateAdvancedEssay(prompt, targetWords);
            break;

        case 'CHAOS_AGENT':
            // Random gibberish or incomplete sentences
            essayText = generateChaosEssay(targetWords);
            break;
    }

    return {
        text: essayText,
        wordCount: essayText.split(/\s+/).length,
        expectedBand: randomBetween(config.bandRange[0], config.bandRange[1]),
        typingSpeed: config.typingSpeed
    };
}

/**
 * Simulate typing behavior (auto-save intervals)
 */
export function getAutoSaveInterval(persona) {
    const config = PERSONAS[persona];

    // Silent warriors type slowly, need more time between auto-saves
    if (persona === 'SILENT_WARRIOR') {
        return 15000; // 15 seconds
    }

    // Samarkand scholars type fast, auto-save more frequently
    if (persona === 'SAMARKAND_SCHOLAR') {
        return 8000; // 8 seconds
    }

    // Chaos agents spam writes
    if (persona === 'CHAOS_AGENT') {
        return randomBetween(3000, 20000);
    }

    return 10000; // 10 seconds default
}

// Helper functions
function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function generateBasicEssay(prompt, targetWords) {
    const sentences = [
        'I think this topic is important.',
        'Many people have different opinion about this.',
        'In my country, we see this problem every day.',
        'Some people say yes, but other people say no.',
        'I agree with this idea because is good.',
        'For example, my friend he do this thing.',
        'This is very difficult to understand sometimes.',
        'In conclusion, I think we must think about it.'
    ];

    let essay = '';
    while (essay.split(/\s+/).length < targetWords) {
        essay += sentences[Math.floor(Math.random() * sentences.length)] + ' ';
    }

    return essay.trim();
}

function generateTemplateEssay(prompt, targetWords, templates) {
    let essay = templates[0] + ' '; // Start with template

    // Add some basic content
    essay += generateBasicEssay(prompt, targetWords - 50);

    // End with template
    essay += ' ' + templates[templates.length - 1];

    return essay;
}

function generateAdvancedEssay(prompt, targetWords) {
    const sentences = [
        'Contemporary discourse surrounding this issue reveals a multifaceted perspective.',
        'Evidence from empirical research suggests that this phenomenon warrants careful consideration.',
        'While proponents argue for immediate implementation, critics raise valid concerns regarding sustainability.',
        'The ramifications of such policies extend beyond superficial economic indicators.',
        'Moreover, cross-cultural analysis demonstrates significant variation in outcomes.',
        'It is imperative to acknowledge the inherent complexity of this matter.',
        'Consequently, a nuanced approach that balances competing interests appears most prudent.'
    ];

    let essay = '';
    while (essay.split(/\s+/).length < targetWords) {
        essay += sentences[Math.floor(Math.random() * sentences.length)] + ' ';
    }

    return essay.trim();
}

function generateChaosEssay(targetWords) {
    const gibberish = 'asdf qwer zxcv poiu lkjh mnbv tyui fghj rtyu vbnm '.split(' ');
    const emojis = '😀😎🔥💀👑⚡🎮🏆'.split('');

    let essay = '';
    const words = Math.floor(Math.random() * targetWords); // Random word count

    for (let i = 0; i < words; i++) {
        if (Math.random() > 0.7) {
            essay += emojis[Math.floor(Math.random() * emojis.length)] + ' ';
        } else {
            essay += gibberish[Math.floor(Math.random() * gibberish.length)] + ' ';
        }
    }

    return essay.trim();
}

/**
 * Get persona distribution for realistic simulation
 * Based on actual market research in Uzbekistan
 */
export function getPersonaDistribution() {
    return {
        SILENT_WARRIOR: 0.40,
        TEMPLATE_TRAPPED: 0.30,
        SAMARKAND_SCHOLAR: 0.20,
        CHAOS_AGENT: 0.10
    };
}

/**
 * Randomly select a persona based on distribution
 */
export function selectRandomPersona() {
    const rand = Math.random();
    const distribution = getPersonaDistribution();

    if (rand < distribution.SILENT_WARRIOR) return 'SILENT_WARRIOR';
    if (rand < distribution.SILENT_WARRIOR + distribution.TEMPLATE_TRAPPED) return 'TEMPLATE_TRAPPED';
    if (rand < distribution.SILENT_WARRIOR + distribution.TEMPLATE_TRAPPED + distribution.SAMARKAND_SCHOLAR) {
        return 'SAMARKAND_SCHOLAR';
    }
    return 'CHAOS_AGENT';
}
