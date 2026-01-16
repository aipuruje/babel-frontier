import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Eye, Zap, Target, CheckCircle2, XCircle } from 'lucide-react';

// Example heading matching scenarios
const HEADING_EXAMPLES = [
    {
        paragraph: "The Industrial Revolution, which began in Britain in the late 18th century, transformed manufacturing processes and led to unprecedented economic growth. Steam power replaced manual labor, and factories emerged as the dominant mode of production. This period saw a massive shift of populations from rural areas to urban centers, as workers sought employment in the new industrial enterprises.",
        correctHeading: "The origins and impact of industrialization",
        distractors: [
            "The decline of agricultural society",
            "Urban migration patterns in modern Britain",
            "Steam technology innovations"
        ],
        explanation: "The paragraph covers THREE key elements: when/where industrialization began, what changed (manufacturing processes), and the effect (economic growth + urbanization). The correct heading captures this SCOPE. Distractors are too narrow (only steam tech) or miss key elements (migration patterns doesn't mention industrialization)."
    }
];

export default function TheoryContent() {
    const [showExample, setShowExample] = useState(false);

    return (
        <motion.div
            className="theory-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2 className="theory-title">Heading Matching Mastery</h2>

            <div className="theory-intro">
                <p>
                    <strong>Matching Headings to Paragraphs</strong> is statistically the most time-consuming
                    question type in IELTS Reading, yet it accounts for 10-14% of all questions. Most candidates
                    spend <em>2-3 minutes per heading</em> because they read every paragraph word-for-word.
                </p>
            </div>

            {/* Pain Point */}
            <section className="theory-section pain-point-section">
                <h3>
                    <AlertTriangle size={20} />
                    Why Candidates Waste Time
                </h3>
                <div className="pain-point-card">
                    <h4>The Word-for-Word Trap</h4>
                    <p>
                        Heading questions appear <strong>before</strong> you read the passage, forcing you to
                        make a choice: read all the headings first (confusing), or read the passage first then
                        match headings (time-consuming). Most candidates choose the second option and end up
                        reading 800+ words just to match 5-6 headings.
                    </p>

                    <div className="time-breakdown">
                        <div className="time-item inefficient">
                            <div className="time-label">❌ Inefficient Approach</div>
                            <div className="time-value">12-15 minutes</div>
                            <div className="time-desc">Read every paragraph fully, then try to remember which heading fits</div>
                        </div>
                        <div className="time-item efficient">
                            <div className="time-label">✅ Strategic Approach</div>
                            <div className="time-value">5-7 minutes</div>
                            <div className="time-desc">Skim topic sentences, identify paragraph themes instantly</div>
                        </div>
                    </div>

                    <div className="critical-insight">
                        <strong>Critical Insight:</strong> You don't need to understand EVERYTHING in a paragraph
                        to match a heading. You only need to identify the <em>main idea</em>. This is pure skimming
                        territory.
                    </div>
                </div>
            </section>

            {/* Skimming Hierarchy */}
            <section className="theory-section">
                <h3>
                    <Eye size={20} />
                    The 3-Second Skimming Hierarchy
                </h3>
                <p className="section-intro">
                    IELTS paragraphs follow predictable structures. You can identify the main idea by reading
                    just 10-15% of the paragraph if you know WHERE to look.
                </p>

                <div className="skimming-hierarchy">
                    <div className="hierarchy-level level-1">
                        <div className="level-priority">Priority 1</div>
                        <div className="level-content">
                            <h4>Topic Sentence (Usually First Sentence)</h4>
                            <p>
                                <strong>90% of paragraphs</strong> state the main idea in the opening sentence.
                                This is your PRIMARY target.
                            </p>
                            <div className="hierarchy-example">
                                <strong>Example:</strong><br />
                                <span className="topic-sentence">"The Internet has revolutionized global communication."</span><br />
                                <em>→ Main idea: Internet's impact on communication</em>
                            </div>
                        </div>
                    </div>

                    <div className="hierarchy-level level-2">
                        <div className="level-priority">Priority 2</div>
                        <div className="level-content">
                            <h4>Concluding Sentence (Last Sentence)</h4>
                            <p>
                                If the first sentence is transitional or contextual, check the <strong>last sentence</strong>.
                                It often summarizes the paragraph's main point.
                            </p>
                            <div className="hierarchy-example">
                                <strong>Example:</strong><br />
                                First sentence: "In 1995, few people owned computers."<br />
                                Last sentence: <span className="topic-sentence">"This digital divide has narrowed considerably."</span><br />
                                <em>→ Main idea: Reduction in digital inequality</em>
                            </div>
                        </div>
                    </div>

                    <div className="hierarchy-level level-3">
                        <div className="level-priority">Priority 3</div>
                        <div className="level-content">
                            <h4>Repeated Keywords / Pronouns</h4>
                            <p>
                                If first and last sentences don't reveal the theme, scan for the <strong>most repeated
                                    noun or concept</strong>. That's likely the paragraph's focus.
                            </p>
                            <div className="hierarchy-example">
                                <strong>Example:</strong><br />
                                Repeated words: "renewable energy" (4 times), "solar panels" (3 times)<br />
                                <em>→ Main idea: Renewable energy technology</em>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Distractor Elimination */}
            <section className="theory-section">
                <h3>
                    <Target size={20} />
                    The Distractor Elimination Strategy
                </h3>
                <p className="section-intro">
                    IELTS heading options include deliberate distractors. Eliminate wrong headings using these rules:
                </p>

                <div className="distractor-rules">
                    <div className="rule-card">
                        <div className="rule-icon">
                            <XCircle size={24} color="#ef4444" />
                        </div>
                        <div className="rule-content">
                            <h4>Rule 1: Too Specific</h4>
                            <p>
                                Heading mentions a <strong>detail</strong> from the paragraph, not the main theme.
                            </p>
                            <div className="rule-example">
                                Paragraph about "effects of climate change"<br />
                                ❌ Heading: "Rising sea levels harm coastal cities"<br />
                                ✅ Heading: "The widespread impacts of global warming"
                            </div>
                        </div>
                    </div>

                    <div className="rule-card">
                        <div className="rule-icon">
                            <XCircle size={24} color="#ef4444" />
                        </div>
                        <div className="rule-content">
                            <h4>Rule 2: Too Broad</h4>
                            <p>
                                Heading covers MORE than what the paragraph discusses.
                            </p>
                            <div className="rule-example">
                                Paragraph about "electric cars reducing emissions"<br />
                                ❌ Heading: "The future of all transportation"<br />
                                ✅ Heading: "Electric vehicles and environmental benefits"
                            </div>
                        </div>
                    </div>

                    <div className="rule-card">
                        <div className="rule-icon">
                            <XCircle size={24} color="#ef4444" />
                        </div>
                        <div className="rule-content">
                            <h4>Rule 3: Keyword Trap</h4>
                            <p>
                                Heading contains words from the paragraph but refers to a DIFFERENT concept.
                            </p>
                            <div className="rule-example">
                                Paragraph: "Students struggle with grammar rules..."<br />
                                ❌ Heading: "The importance of grammar in education" (mentions grammar, wrong theme)<br />
                                ✅ Heading: "Challenges in language learning"
                            </div>
                        </div>
                    </div>

                    <div className="rule-card">
                        <div className="rule-icon">
                            <CheckCircle2 size={24} color="#10b981" />
                        </div>
                        <div className="rule-content">
                            <h4>Rule 4: Perfect Fit</h4>
                            <p>
                                Correct heading matches the <strong>scope</strong> and <strong>theme</strong> exactly.
                            </p>
                            <div className="rule-example">
                                Paragraph discusses: "causes + effects of deforestation"<br />
                                ✅ Heading: "Why forests disappear and the consequences"
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Strategy Steps */}
            <section className="theory-section">
                <h3>
                    <Zap size={20} />
                    The 4-Step Heading Matching Process
                </h3>

                <div className="strategy-steps">
                    <div className="strategy-step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h4>Skim All Headings First</h4>
                            <p>
                                Read all heading options quickly. Don't analyze—just get a sense of the topics covered.
                                This primes your brain.
                            </p>
                        </div>
                    </div>

                    <div className="strategy-step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h4>Read Topic Sentence Only</h4>
                            <p>
                                For each paragraph, read ONLY the first sentence. Ask: "What is this paragraph about?"
                            </p>
                        </div>
                    </div>

                    <div className="strategy-step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h4>Match by Theme, Not Words</h4>
                            <p>
                                Look for the heading that matches the CONCEPT, even if the words are different.
                                Paraphrasing applies here too!
                            </p>
                        </div>
                    </div>

                    <div className="strategy-step">
                        <div className="step-number">4</div>
                        <div className="step-content">
                            <h4>Verify with Last Sentence</h4>
                            <p>
                                If unsure, quickly skim the last sentence or look for repeated keywords. This confirms
                                your choice.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Interactive Example */}
            <section className="theory-section">
                <h3>📝 Interactive Example</h3>
                <p className="section-intro">
                    Try this real heading matching scenario:
                </p>

                <div className="interactive-example">
                    <div className="example-paragraph">
                        <h4>Paragraph:</h4>
                        <p>{HEADING_EXAMPLES[0].paragraph}</p>
                    </div>

                    <div className="example-headings">
                        <h4>Choose the best heading:</h4>
                        <button className="heading-option" onClick={() => setShowExample(true)}>
                            {HEADING_EXAMPLES[0].correctHeading}
                        </button>
                        {HEADING_EXAMPLES[0].distractors.map((distractor, index) => (
                            <button key={index} className="heading-option distractor" onClick={() => setShowExample(true)}>
                                {distractor}
                            </button>
                        ))}
                    </div>

                    {showExample && (
                        <motion.div
                            className="example-explanation"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <strong>✓ Correct Answer:</strong> {HEADING_EXAMPLES[0].correctHeading}
                            <p>{HEADING_EXAMPLES[0].explanation}</p>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Practice CTA */}
            <div className="theory-cta">
                <h4>Ready to Master Heading Matching?</h4>
                <p>
                    Switch to <strong>Practice</strong> to test your skimming skills with real IELTS passages,
                    or try <strong>Battle Mode</strong> for speed matching challenges.
                </p>
            </div>
        </motion.div>
    );
}
