import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, HelpCircle, Lightbulb, Target } from 'lucide-react';

// Blue Car examples for tutorial
const BLUE_CAR_EXAMPLES = [
    {
        text: 'Peter has a blue car.',
        statement: 'Peter has a green car.',
        answer: 'FALSE',
        explanation: 'The statement directly contradicts the text. The text says blue, statement says green.'
    },
    {
        text: 'Peter has a blue car.',
        statement: 'Peter has a bicycle.',
        answer: 'NOT GIVEN',
        explanation: 'The text tells us about his car, but says nothing about a bicycle. He might have one, or he might not. We simply don\'t know.'
    },
    {
        text: 'Peter has a blue car.',
        statement: 'Peter does not have a blue car.',
        answer: 'FALSE',
        explanation: 'This directly contradicts the text. The text explicitly states he HAS a blue car.'
    },
    {
        text: 'Peter has a blue car.',
        statement: 'Peter drives his car to work.',
        answer: 'NOT GIVEN',
        explanation: 'We know he has a car, but the text says nothing about what he does with it. This is NOT GIVEN, not FALSE.'
    }
];

export default function TheoryContent() {
    const [currentExample, setCurrentExample] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);

    const handleNextExample = () => {
        setShowAnswer(false);
        setCurrentExample((prev) => (prev + 1) % BLUE_CAR_EXAMPLES.length);
    };

    const handlePrevExample = () => {
        setShowAnswer(false);
        setCurrentExample((prev) => (prev - 1 + BLUE_CAR_EXAMPLES.length) % BLUE_CAR_EXAMPLES.length);
    };

    const example = BLUE_CAR_EXAMPLES[currentExample];

    return (
        <motion.div
            className="theory-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2 className="theory-title">Mastering Ternary Logic</h2>

            <div className="theory-intro">
                <p>
                    The <strong>True/False/Not Given</strong> (and Yes/No/Not Given) question types are universally
                    cited as the <em>most confusing and error-prone</em> in the entire IELTS Reading test. Why?
                    Because they introduce a <strong>ternary logical system</strong> that conflicts with how humans
                    naturally communicate.
                </p>
            </div>

            {/* Pain Point */}
            <section className="theory-section pain-point-section">
                <h3>
                    <AlertTriangle size={20} />
                    The Core Problem: Binary vs. Ternary Thinking
                </h3>
                <div className="pain-point-card">
                    <h4>Why It's So Hard</h4>
                    <p>
                        Most standardized tests use <strong>binary logic</strong>: something is either Correct or Incorrect.
                        IELTS introduces a third option that breaks our natural thinking patterns:
                    </p>

                    <div className="logic-comparison">
                        <div className="logic-box binary-logic">
                            <h5>Natural Communication</h5>
                            <p>"I only eat chicken" → <em>Implies</em> "I don't eat beef"</p>
                            <p className="logic-note">We use inference constantly</p>
                        </div>

                        <div className="logic-box ielts-logic">
                            <h5>IELTS Logic</h5>
                            <p>Text: "I eat chicken"</p>
                            <p>Statement: "He doesn't eat beef" → <strong>NOT GIVEN</strong></p>
                            <p className="logic-note">No inference allowed unless explicitly stated</p>
                        </div>
                    </div>

                    <div className="critical-rule">
                        <Lightbulb size={20} />
                        <div>
                            <strong>Golden Rule:</strong> You can ONLY use information that is explicitly stated
                            or logically contained in the text. Outside knowledge, assumptions, and "obvious"
                            inferences will lead you to wrong answers.
                        </div>
                    </div>
                </div>
            </section>

            {/* Logic Matrix */}
            <section className="theory-section">
                <h3>
                    <Target size={20} />
                    The Logic Matrix
                </h3>

                <div className="logic-matrix">
                    <div className="matrix-card true-card">
                        <div className="matrix-icon">
                            <CheckCircle size={32} />
                        </div>
                        <h4>TRUE / YES</h4>
                        <p>The statement <strong>agrees</strong> with the information in the text.</p>
                        <ul>
                            <li>Usually expressed via synonyms or paraphrasing</li>
                            <li>The meaning is the same, even if words are different</li>
                        </ul>
                        <div className="matrix-example">
                            <strong>Example:</strong><br />
                            Text: "The population <u>decreased significantly</u>."<br />
                            Statement: "The population <u>plummeted</u>." → <span className="answer-true">TRUE</span>
                        </div>
                    </div>

                    <div className="matrix-card false-card">
                        <div className="matrix-icon">
                            <XCircle size={32} />
                        </div>
                        <h4>FALSE / NO</h4>
                        <p>The statement <strong>contradicts</strong> the information in the text.</p>
                        <ul>
                            <li>There must be a direct contradiction</li>
                            <li>Look for opposite meanings, not just absence of info</li>
                        </ul>
                        <div className="matrix-example">
                            <strong>Example:</strong><br />
                            Text: "Most scientists agree."<br />
                            Statement: "All scientists agree." → <span className="answer-false">FALSE</span><br />
                            <em>(Quantifier changed: "most" ≠ "all")</em>
                        </div>
                    </div>

                    <div className="matrix-card ng-card">
                        <div className="matrix-icon">
                            <HelpCircle size={32} />
                        </div>
                        <h4>NOT GIVEN</h4>
                        <p>The information is <strong>neither confirmed nor contradicted</strong> in the text.</p>
                        <ul>
                            <li>The text doesn't provide enough information to verify</li>
                            <li>It's not mentioned, or only partially mentioned</li>
                        </ul>
                        <div className="matrix-example">
                            <strong>Example:</strong><br />
                            Text: "He won the election."<br />
                            Statement: "He was happy about winning." → <span className="answer-ng">NOT GIVEN</span><br />
                            <em>(Maybe he was, maybe he wasn't - text doesn't say)</em>
                        </div>
                    </div>
                </div>
            </section>

            {/* Blue Car Tutorial */}
            <section className="theory-section blue-car-section">
                <h3>🚗 The Famous "Blue Car" Tutorial</h3>
                <p className="section-intro">
                    This simple example has helped thousands of students finally "get" the TFNG concept.
                    Work through these 4 classic scenarios:
                </p>

                <div className="blue-car-interactive">
                    <div className="blue-car-content">
                        <div className="text-box">
                            <div className="text-label">TEXT:</div>
                            <div className="text-content">{example.text}</div>
                        </div>

                        <div className="statement-box">
                            <div className="statement-label">STATEMENT:</div>
                            <div className="statement-content">{example.statement}</div>
                        </div>

                        <AnimatePresence mode="wait">
                            {!showAnswer ? (
                                <motion.button
                                    key="reveal"
                                    className="reveal-button"
                                    onClick={() => setShowAnswer(true)}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    Reveal Answer
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="answer"
                                    className="answer-reveal"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <div className={`answer-badge ${example.answer.toLowerCase().replace(' ', '-')}`}>
                                        {example.answer}
                                    </div>
                                    <div className="explanation-text">
                                        {example.explanation}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="blue-car-navigation">
                        <button
                            className="nav-btn"
                            onClick={handlePrevExample}
                            disabled={currentExample === 0}
                        >
                            ← Previous
                        </button>
                        <span className="example-counter">
                            {currentExample + 1} / {BLUE_CAR_EXAMPLES.length}
                        </span>
                        <button
                            className="nav-btn"
                            onClick={handleNextExample}
                            disabled={currentExample === BLUE_CAR_EXAMPLES.length - 1}
                        >
                            Next →
                        </button>
                    </div>
                </div>
            </section>

            {/* Common Traps */}
            <section className="theory-section">
                <h3>⚠️ The 3 Deadliest Traps</h3>

                <div className="trap-grid">
                    <div className="trap-card">
                        <div className="trap-number">1</div>
                        <h4>The Inference Trap</h4>
                        <p>
                            <strong>Mistake:</strong> Using outside knowledge or "obvious" conclusions.
                        </p>
                        <div className="trap-example">
                            Text: "Shakespeare wrote plays."<br />
                            Statement: "Shakespeare was a talented writer." → <strong>NG</strong><br />
                            <em>Even though it's "obvious," the text doesn't explicitly say it!</em>
                        </div>
                    </div>

                    <div className="trap-card">
                        <div className="trap-number">2</div>
                        <h4>The Qualifier Trap</h4>
                        <p>
                            <strong>Mistake:</strong> Missing key words like "all," "some," "most," "always," "never."
                        </p>
                        <div className="trap-example">
                            Text: "Some birds can swim."<br />
                            Statement: "All birds can swim." → <strong>FALSE</strong><br />
                            <em>One word changes everything!</em>
                        </div>
                    </div>

                    <div className="trap-card">
                        <div className="trap-number">3</div>
                        <h4>The "Not Mentioned = False" Trap</h4>
                        <p>
                            <strong>Mistake:</strong> Thinking that if something isn't mentioned, it must be False.
                        </p>
                        <div className="trap-example">
                            Text: "The experiment was successful."<br />
                            Statement: "The experiment was expensive." → <strong>NG</strong><br />
                            <em>Not mentioned ≠ False. It might be expensive, we just don't know!</em>
                        </div>
                    </div>
                </div>
            </section>

            {/* Strategy */}
            <section className="theory-section">
                <h3>✅ The 4-Step TFNG Strategy</h3>

                <div className="strategy-steps">
                    <div className="strategy-step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h4>Identify Keywords</h4>
                            <p>Underline the subject, verb, and key nouns in the statement.</p>
                        </div>
                    </div>

                    <div className="strategy-step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h4>Find the Relevant Section</h4>
                            <p>Scan the text for those keywords (or their synonyms).</p>
                        </div>
                    </div>

                    <div className="strategy-step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h4>Check for Contradiction</h4>
                            <p>Does the text say the OPPOSITE? → FALSE<br />If not, move to step 4.</p>
                        </div>
                    </div>

                    <div className="strategy-step">
                        <div className="step-number">4</div>
                        <div className="step-content">
                            <h4>Check for Confirmation</h4>
                            <p>Is the exact information stated (maybe paraphrased)? → TRUE<br />If not confirmed and not contradicted → NOT GIVEN</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Practice CTA */}
            <div className="theory-cta">
                <h4>Ready to Test Your Logic?</h4>
                <p>
                    Switch to <strong>Practice</strong> to work through real TFNG questions with our
                    qualifier highlighter, or try <strong>Battle Mode</strong> for speed drills.
                </p>
            </div>
        </motion.div>
    );
}
