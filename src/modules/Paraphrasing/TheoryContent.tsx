import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Layers, Zap, Target, BookOpen } from 'lucide-react';

// 5 levels of paraphrasing with examples
const PARAPHRASING_LEVELS = [
    {
        level: 1,
        name: 'Synonym Substitution',
        description: 'Simple word-for-word replacement',
        difficulty: 'Easy',
        color: '#10b981',
        examples: [
            { original: 'increase', paraphrase: 'rise, grow, climb, surge, expand' },
            { original: 'decrease', paraphrase: 'fall, drop, decline, reduce, diminish' },
            { original: 'important', paraphrase: 'significant, crucial, vital, essential, key' },
            { original: 'difficult', paraphrase: 'challenging, hard, tough, complex, demanding' }
        ]
    },
    {
        level: 2,
        name: 'Word Class Change',
        description: 'Changing the grammatical form while keeping meaning',
        difficulty: 'Moderate',
        color: '#f59e0b',
        examples: [
            { original: 'consumption (noun)', paraphrase: 'consume (verb), consumed (past)' },
            { original: 'successful (adj)', paraphrase: 'success (noun), succeed (verb)' },
            { original: 'rapidly (adverb)', paraphrase: 'rapid (adj), rapidity (noun)' },
            { original: 'population (noun)', paraphrase: 'populate (verb), populated (adj)' }
        ]
    },
    {
        level: 3,
        name: 'Antonym + Negation',
        description: 'Using the opposite word with "not"',
        difficulty: 'Moderate',
        color: '#3b82f6',
        examples: [
            { original: 'cheap', paraphrase: 'not expensive, inexpensive' },
            { original: 'easy', paraphrase: 'not difficult, not hard' },
            { original: 'rare', paraphrase: 'not common, uncommon' },
            { original: 'modern', paraphrase: 'not traditional, not old-fashioned' }
        ]
    },
    {
        level: 4,
        name: 'Generalization / Specification',
        description: 'Moving between specific and general terms',
        difficulty: 'Hard',
        color: '#8b5cf6',
        examples: [
            { original: 'citrus fruit', paraphrase: 'oranges and lemons (specific examples)' },
            { original: 'transportation', paraphrase: 'cars, buses, trains (specific types)' },
            { original: 'rose, tulip, daisy', paraphrase: 'flowers (general category)' },
            { original: 'smartphone', paraphrase: 'device, technology (broader term)' }
        ]
    },
    {
        level: 5,
        name: 'Semantic/Conceptual',
        description: 'Complete restructuring of the idea',
        difficulty: 'Very Hard',
        color: '#ef4444',
        examples: [
            { original: 'The project failed', paraphrase: 'The outcome did not meet expectations' },
            { original: 'He is wealthy', paraphrase: 'He has substantial financial resources' },
            { original: 'Sales increased', paraphrase: 'The company experienced revenue growth' },
            { original: 'Pollution is harmful', paraphrase: 'Environmental contamination poses risks' }
        ]
    }
];

// Common IELTS synonym pairs for practice
const SYNONYM_PAIRS = [
    { word: 'abundant', synonym: 'plentiful' },
    { word: 'accurate', synonym: 'precise' },
    { word: 'achieve', synonym: 'accomplish' },
    { word: 'ancient', synonym: 'old' },
    { word: 'approximately', synonym: 'roughly' },
    { word: 'beneficial', synonym: 'advantageous' },
    { word: 'catastrophic', synonym: 'disastrous' },
    { word: 'cease', synonym: 'stop' },
    { word: 'comprehend', synonym: 'understand' },
    { word: 'conduct', synonym: 'carry out' },
    { word: 'contemporary', synonym: 'modern' },
    { word: 'detrimental', synonym: 'harmful' },
    { word: 'eliminate', synonym: 'remove' },
    { word: 'enhance', synonym: 'improve' },
    { word: 'evident', synonym: 'obvious' },
    { word: 'facilitate', synonym: 'help' },
    { word: 'fundamental', synonym: 'basic' },
    { word: 'implement', synonym: 'carry out' },
    { word: 'inevitable', synonym: 'unavoidable' },
    { word: 'innovative', synonym: 'new' }
];

export default function TheoryContent() {
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
    const [currentSynonym, setCurrentSynonym] = useState(0);

    return (
        <motion.div
            className="theory-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2 className="theory-title">The Art of Paraphrasing</h2>

            <div className="theory-intro">
                <p>
                    If there's <strong>one skill</strong> that defines IELTS Reading success, it's the ability
                    to recognize paraphrasing. The test <em>systematically avoids</em> using the exact words
                    from questions in the text. This creates massive friction for candidates who rely on
                    "keyword spotting."
                </p>
            </div>

            {/* Pain Point */}
            <section className="theory-section pain-point-section">
                <h3>
                    <AlertTriangle size={20} />
                    The Keyword Fallacy
                </h3>
                <div className="pain-point-card">
                    <h4>Why "Find the Keyword" Fails</h4>
                    <p>
                        Low-proficiency candidates use a simple strategy: scan for a word from the question,
                        find it in the text, and assume that's where the answer is. IELTS test designers know this.
                    </p>

                    <div className="trap-example-box">
                        <div className="trap-title">🎯 The Trap in Action</div>
                        <div className="trap-content">
                            <strong>Question:</strong> What caused the rapid decline in bird populations?<br />
                            <strong>Keyword Spotted:</strong> "rapid decline" appears in paragraph 3<br />
                            <strong>Candidate thinks:</strong> "Found it! The answer must be here!"<br />
                            <strong>Reality:</strong> That section discusses fish, not birds. It's a <span className="highlight-danger">distractor</span>.<br />
                            <strong>Actual Answer:</strong> Paragraph 5 says "avian species plummeted precipitously due to..."
                        </div>
                    </div>

                    <div className="critical-insight">
                        <strong>Critical Insight:</strong> The correct answer uses <em>meaning</em>, not the same
                        <em>words</em>. "Plummeted precipitously" = "rapid decline." If you don't recognize this
                        paraphrasing, you miss the answer entirely.
                    </div>
                </div>
            </section>

            {/* 5-Level Hierarchy */}
            <section className="theory-section">
                <h3>
                    <Layers size={20} />
                    The 5-Level Paraphrasing Hierarchy
                </h3>
                <p className="section-intro">
                    IELTS uses 5 distinct paraphrasing techniques, ranging from simple synonyms to complete
                    conceptual restructuring. You must master all 5 levels.
                </p>

                <div className="paraphrasing-levels">
                    {PARAPHRASING_LEVELS.map((level) => (
                        <motion.div
                            key={level.level}
                            className={`level-card ${selectedLevel === level.level ? 'expanded' : ''}`}
                            onClick={() => setSelectedLevel(selectedLevel === level.level ? null : level.level)}
                            style={{ borderLeftColor: level.color }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="level-header">
                                <div className="level-number" style={{ backgroundColor: level.color }}>
                                    {level.level}
                                </div>
                                <div className="level-info">
                                    <h4>{level.name}</h4>
                                    <p>{level.description}</p>
                                </div>
                                <div className="level-difficulty" style={{ color: level.color }}>
                                    {level.difficulty}
                                </div>
                            </div>

                            {selectedLevel === level.level && (
                                <motion.div
                                    className="level-examples"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <h5>Examples:</h5>
                                    {level.examples.map((example, index) => (
                                        <div key={index} className="example-row">
                                            <span className="original-text">{example.original}</span>
                                            <ArrowRight size={16} className="arrow-icon" />
                                            <span className="paraphrase-text">{example.paraphrase}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>

                <div className="hierarchy-note">
                    <Target size={20} />
                    <div>
                        <strong>Pro Tip:</strong> In Battle Mode and real tests, most paraphrasing is Level 1-3.
                        However, Passage 3 often uses Level 4-5 to separate high-scoring candidates (Band 7+)
                        from the rest.
                    </div>
                </div>
            </section>

            {/* Synonym Practice */}
            <section className="theory-section">
                <h3>
                    <BookOpen size={20} />
                    Quick Synonym Drill
                </h3>
                <p className="section-intro">
                    Test your synonym recognition with these common IELTS word pairs:
                </p>

                <div className="synonym-flashcard">
                    <div className="flashcard-word">{SYNONYM_PAIRS[currentSynonym].word}</div>
                    <div className="flashcard-synonym">
                        <Zap size={16} />
                        {SYNONYM_PAIRS[currentSynonym].synonym}
                    </div>

                    <div className="flashcard-controls">
                        <button
                            className="flashcard-btn"
                            onClick={() => setCurrentSynonym((prev) => (prev - 1 + SYNONYM_PAIRS.length) % SYNONYM_PAIRS.length)}
                        >
                            ← Previous
                        </button>
                        <span className="flashcard-counter">
                            {currentSynonym + 1} / {SYNONYM_PAIRS.length}
                        </span>
                        <button
                            className="flashcard-btn"
                            onClick={() => setCurrentSynonym((prev) => (prev + 1) % SYNONYM_PAIRS.length)}
                        >
                            Next →
                        </button>
                    </div>
                </div>
            </section>

            {/* Strategy */}
            <section className="theory-section">
                <h3>🎯 The Anti-Keyword Strategy</h3>

                <div className="strategy-box">
                    <h4>How to Find Paraphrased Answers</h4>
                    <ol className="strategy-list">
                        <li>
                            <strong>Identify the core concept</strong> in the question, not just the keywords.
                            <br /><em>Example: "rapid decline" = concept of fast decrease</em>
                        </li>
                        <li>
                            <strong>Think of synonyms</strong> before you scan.
                            <br /><em>rapid = quick, fast, speedy, swift / decline = fall, drop, decrease, plummet</em>
                        </li>
                        <li>
                            <strong>Scan for meaning</strong>, not exact words.
                            <br /><em>Look for any word expressing "fast" + "decrease"</em>
                        </li>
                        <li>
                            <strong>Beware of keyword distractors</strong> - exact matches are often traps.
                            <br /><em>If you see the exact phrase "rapid decline," be suspicious!</em>
                        </li>
                        <li>
                            <strong>Look for grammatical transformations</strong>.
                            <br /><em>"consumption increased" might become "people consumed more"</em>
                        </li>
                    </ol>
                </div>
            </section>

            {/* Practice CTA */}
            <div className="theory-cta">
                <h4>Ready to Hunt for Paraphrases?</h4>
                <p>
                    Switch to <strong>Practice</strong> to test your skills with real passages featuring
                    all 5 paraphrasing levels, or try <strong>Battle Mode</strong> for speed synonym matching.
                </p>
            </div>
        </motion.div>
    );
}
