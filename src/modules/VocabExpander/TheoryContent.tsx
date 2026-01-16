import { motion } from 'framer-motion';
import { BookOpen, TrendingUp, Lightbulb, Zap, AlertCircle } from 'lucide-react';

export default function TheoryContent() {
    return (
        <motion.div
            className="theory-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2 className="theory-title">Vocabulary Expander</h2>

            <div className="theory-intro">
                <p>
                    IELTS Reading demands recognition of <strong>3,000-5,000 academic words</strong> beyond
                    everyday English. Most candidates fail not because they can't read, but because they
                    encounter <strong>lexical gaps</strong>—critical vocabulary they've never seen in context.
                    This module teaches you the 500 most high-impact academic words through contextual learning.
                </p>
            </div>

            {/* Pain Point */}
            <section className="theory-section pain-point-section">
                <h3>
                    <AlertCircle size={20} />
                    The Vocabulary Trap
                </h3>
                <div className="pain-point-card">
                    <h4>Why Memorizing Word Lists Fails</h4>
                    <p>
                        Traditional vocabulary learning—flashcards with isolated definitions—creates
                        <strong> recognition gaps</strong>. You might "know" a word in isolation but fail to
                        recognize it in academic context because:
                    </p>

                    <div className="trap-list">
                        <div className="trap-item">
                            <div className="trap-number">1</div>
                            <div className="trap-content">
                                <h5>Polysemy Problem</h5>
                                <p>
                                    Academic words have multiple meanings. "Address" can mean: speak to (verb),
                                    location (noun), or tackle a problem (verb). Knowing one definition doesn't
                                    transfer to others.
                                </p>
                                <div className="example">
                                    <strong>IELTS Example:</strong> "The study addresses the reproducibility crisis"
                                    ≠ "Write your address on the form"
                                </div>
                            </div>
                        </div>

                        <div className="trap-item">
                            <div className="trap-number">2</div>
                            <div className="trap-content">
                                <h5>Collocation Blindness</h5>
                                <p>
                                    Words combine in predictable patterns (collocations). Native speakers say
                                    "conduct research," not "do research" or "make research." IELTS passages use
                                    authentic collocations that memorization alone won't teach.
                                </p>
                                <div className="example">
                                    <strong>Common IELTS Collocations:</strong> mitigate risk, exert influence,
                                    establish precedent, yield results
                                </div>
                            </div>
                        </div>

                        <div className="trap-item">
                            <div className="trap-number">3</div>
                            <div className="trap-content">
                                <h5>Register Mismatch</h5>
                                <p>
                                    Academic vocabulary has formal register. Knowing "get rid of" doesn't help you
                                    recognize "eliminate," "eradicate," or "obviate" in IELTS texts, even though
                                    they share similar meanings.
                                </p>
                                <div className="example">
                                    <strong>Register Shift:</strong> show → demonstrate | worsen → exacerbate |
                                    lessen → mitigate
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Solution */}
            <section className="theory-section">
                <h3>
                    <Lightbulb size={20} />
                    Context-First Learning Method
                </h3>
                <p className="section-intro">
                    This module uses the method that actually works: encountering words in authentic IELTS-style
                    sentences, not isolated definitions.
                </p>

                <div className="method-steps">
                    <div className="method-step">
                        <div className="step-icon">📖</div>
                        <div className="step-content">
                            <h4>Step 1: Contextual Exposure</h4>
                            <p>
                                You see the word in a real IELTS sentence first, forcing your brain to infer meaning
                                from context—exactly what you'll do in the exam.
                            </p>
                            <div className="method-example">
                                <div className="context-sentence">
                                    "Anthropogenic emissions <span className="vocab-highlight">exacerbate</span>
                                    climate instability, creating feedback loops that amplify warming."
                                </div>
                                <div className="inference">
                                    <strong>Your brain infers:</strong> "exacerbate" = make worse (from "amplify" and
                                    "instability")
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="method-step">
                        <div className="step-icon">🔍</div>
                        <div className="step-content">
                            <h4>Step 2: Precise Definition + Word Family</h4>
                            <p>
                                After inference, you get the exact definition PLUS related forms (exacerbate →
                                exacerbation → exacerbated). This builds recognition of the entire word family.
                            </p>
                        </div>
                    </div>

                    <div className="method-step">
                        <div className="step-icon">🔗</div>
                        <div className="step-content">
                            <h4>Step 3: Collocation Patterns</h4>
                            <p>
                                You learn common word partnerships: exacerbate + [tension, inequality, symptoms,
                                crisis]. This is how natives recognize words instantly.
                            </p>
                        </div>
                    </div>

                    <div className="method-step">
                        <div className="step-icon">♻️</div>
                        <div className="step-content">
                            <h4>Step 4: Spaced Repetition</h4>
                            <p>
                                Words resurface at optimal intervals (1 day, 3 days, 7 days, 14 days). Your brain
                                builds long-term memory through strategic review, not cramming.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* The 500 Words */}
            <section className="theory-section">
                <h3>
                    <TrendingUp size={20} />
                    The 500-Word Priority List
                </h3>
                <p className="section-intro">
                    We've analyzed 10+ years of IELTS Reading tests to identify the 500 words with the highest
                    ROI. These aren't random academic words—they're the ones that appear repeatedly.
                </p>

                <div className="word-categories">
                    <div className="word-category">
                        <h4>🔬 Scientific Process (100 words)</h4>
                        <p>
                            hypothesis, methodology, empirical, replicate, anomaly, substantiate, refute, postulate,
                            deduce, corroborate
                        </p>
                    </div>

                    <div className="word-category">
                        <h4>📊 Data & Analysis (100 words)</h4>
                        <p>
                            quantify, aggregate, extrapolate, correlation, discrepancy, negligible, marginal,
                            fluctuate, plateau, trajectory
                        </p>
                    </div>

                    <div className="word-category">
                        <h4>🏛️ Social Systems (100 words)</h4>
                        <p>
                            infrastructure, paradigm, hierarchy, demographic, stratification, cohesion, disparity,
                            integration, segregation, autonomy
                        </p>
                    </div>

                    <div className="word-category">
                        <h4>💡 Concepts & Ideas (100 words)</h4>
                        <p>
                            abstract, conceptual, pragmatic, paradox, dichotomy, synthesis, juxtapose, analogous,
                            inherent, intrinsic
                        </p>
                    </div>

                    <div className="word-category">
                        <h4>🔄 Change & Causation (100 words)</h4>
                        <p>
                            precipitate, catalyst, instigate, undermine, perpetuate, accelerate, impede, mitigate,
                            exacerbate, ameliorate
                        </p>
                    </div>
                </div>
            </section>

            {/* Strategy */}
            <section className="theory-section">
                <h3>
                    <Zap size={20} />
                    Learning Strategy
                </h3>
                <div className="strategy-card">
                    <h4>The 10-Word Daily Method</h4>
                    <p>
                        Don't try to cram 500 words in a week. Research shows optimal retention comes from
                        learning <strong>10 new words per day</strong> while reviewing previous words through
                        spaced repetition.
                    </p>

                    <div className="timeline">
                        <div className="timeline-item">
                            <div className="timeline-day">Day 1-5</div>
                            <div className="timeline-content">50 new words + daily review</div>
                        </div>
                        <div className="timeline-item">
                            <div className="timeline-day">Day 6-10</div>
                            <div className="timeline-content">50 new words + review 100 total</div>
                        </div>
                        <div className="timeline-item">
                            <div className="timeline-day">Day 11-50</div>
                            <div className="timeline-content">10 new/day + systematic review</div>
                        </div>
                        <div className="timeline-result">
                            <strong>Result after 50 days:</strong> 500 words in long-term memory with 90%+
                            retention rate
                        </div>
                    </div>

                    <div className="pro-tip">
                        <BookOpen size={18} />
                        <strong>Pro Tip:</strong> Use the Practice tab to simulate finding these words in real
                        IELTS passages. Context beats flashcards every time.
                    </div>
                </div>
            </section>

            {/* Practice CTA */}
            <div className="theory-cta">
                <h4>Ready to Build Your Vocabulary?</h4>
                <p>
                    Switch to <strong>Practice</strong> to start learning the first 50 words through
                    contextual flashcards, or try <strong>Battle Mode</strong> to test recognition in
                    authentic IELTS passages.
                </p>
            </div>
        </motion.div>
    );
}
