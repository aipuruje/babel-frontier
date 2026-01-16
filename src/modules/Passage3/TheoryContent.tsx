import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Zap, Target, Trophy, Battery } from 'lucide-react';

export default function TheoryContent() {
    return (
        <motion.div
            className="theory-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2 className="theory-title">Passage 3 Survival Kit</h2>

            <div className="theory-intro">
                <p>
                    Passage 3 is the <strong>final boss</strong> of IELTS Reading. By the time you reach it at
                    the 40-minute mark, you're mentally fatigued, time-pressured, and facing the exam's most
                    complex academic text. Most candidates collapse here. This module teaches you how to not
                    just survive, but dominate Passage 3.
                </p>
            </div>

            {/* Pain Point */}
            <section className="theory-section pain-point-section">
                <h3>
                    <AlertTriangle size={20} />
                    Why Passage 3 Destroys Most Candidates
                </h3>
                <div className="pain-point-card">
                    <h4>The Progressive Difficulty Curve</h4>
                    <p>
                        IELTS Reading is deliberately designed with <strong>increasing difficulty</strong>.
                        Passage 1 is relatively straightforward (Band 5-6 level), Passage 2 is moderate (Band
                        6.5-7), and Passage 3 is brutal (Band 7.5-8.5). This isn't random—it's strategic.
                    </p>

                    <div className="difficulty-progression">
                        <div className="passage-difficulty passage-1">
                            <div className="passage-label">Passage 1</div>
                            <div className="passage-level">Moderate</div>
                            <div className="passage-stats">
                                <div className="stat">Avg. Lexical Density: 45%</div>
                                <div className="stat">Avg. Sentence Length: 18 words</div>
                                <div className="stat">Question Difficulty: Medium</div>
                            </div>
                        </div>
                        <div className="passage-difficulty passage-2">
                            <div className="passage-label">Passage 2</div>
                            <div className="passage-level">Challenging</div>
                            <div className="passage-stats">
                                <div className="stat">Avg. Lexical Density: 52%</div>
                                <div className="stat">Avg. Sentence Length: 22 words</div>
                                <div className="stat">Question Difficulty: Hard</div>
                            </div>
                        </div>
                        <div className="passage-difficulty passage-3">
                            <div className="passage-label">Passage 3</div>
                            <div className="passage-level">Brutal</div>
                            <div className="passage-stats">
                                <div className="stat">Avg. Lexical Density: 58%</div>
                                <div className="stat">Avg. Sentence Length: 26 words</div>
                                <div className="stat">Question Difficulty: Extreme</div>
                            </div>
                        </div>
                    </div>

                    <div className="critical-insight">
                        <strong>Critical Reality:</strong> By the time you start Passage 3 at minute 40, you have
                        only <strong>20 minutes remaining</strong> to handle 13-14 questions on the hardest text.
                        Most candidates panic, rush, and make catastrophic errors.
                    </div>
                </div>
            </section>

            {/* The 3 Killers */}
            <section className="theory-section">
                <h3>
                    <TrendingUp size={20} />
                    The 3 Passage 3 Killers
                </h3>
                <p className="section-intro">
                    Three factors combine to make Passage 3 devastating. Understanding them is the first step
                    to survival.
                </p>

                <div className="killer-cards">
                    <div className="killer-card">
                        <div className="killer-number">1</div>
                        <div className="killer-content">
                            <h4>Cumulative Cognitive Fatigue</h4>
                            <p>
                                After 40 minutes of intense reading and decision-making on Passages 1 and 2, your
                                working memory is depleted by an estimated <strong>60-70%</strong>. Pattern recognition
                                slows, you miss paraphrases, and TFNG logic feels harder.
                            </p>
                            <div className="killer-impact">
                                <strong>Impact:</strong> Questions that would take 60 seconds fresh now take 90-120 seconds.
                            </div>
                        </div>
                    </div>

                    <div className="killer-card">
                        <div className="killer-number">2</div>
                        <div className="killer-content">
                            <h4>Time Pressure Escalation</h4>
                            <p>
                                Clock anxiety peaks. You're hyperaware of every passing second. This triggers the
                                stress response: cortisol spikes, heart rate increases, and prefrontal cortex function
                                (needed for TFNG logic and inference) diminishes.
                            </p>
                            <div className="killer-impact">
                                <strong>Impact:</strong> Rushed answers, skipped question analysis, and panic-driven guessing.
                            </div>
                        </div>
                    </div>

                    <div className="killer-card">
                        <div className="killer-number">3</div>
                        <div className="killer-content">
                            <h4>Maximum Linguistic Complexity</h4>
                            <p>
                                Passage 3 uses academic register at its peak: abstract concepts, dense nominalization,
                                subordinate clauses within subordinate clauses, and deliberate lexical obscurity. Test
                                makers save their most sophisticated paraphrasing for here.
                            </p>
                            <div className="killer-impact">
                                <strong>Impact:</strong> Reading comprehension drops 15-20% compared to Passage 1.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Energy Management Strategy */}
            <section className="theory-section">
                <h3>
                    <Battery size={20} />
                    The Energy Bank Model
                </h3>
                <p className="section-intro">
                    Think of your mental energy as a bank account. You start with 100 energy points. Every
                    passage drains it. The key is strategic spending.
                </p>

                <div className="energy-model">
                    <div className="energy-allocation">
                        <div className="energy-bar">
                            <div className="energy-segment passage1-energy" style={{ width: '30%' }}>
                                <span>Passage 1: 30 points</span>
                            </div>
                            <div className="energy-segment passage2-energy" style={{ width: '35%' }}>
                                <span>Passage 2: 35 points</span>
                            </div>
                            <div className="energy-segment passage3-energy" style={{ width: '35%' }}>
                                <span>Passage 3: 35 points</span>
                            </div>
                        </div>
                    </div>

                    <div className="energy-tactics">
                        <h4>Energy Preservation Tactics:</h4>
                        <ul>
                            <li><strong>Passage 1:</strong> Cruise mode. Don't overthink. Aim for 90% accuracy in 17-18 minutes.</li>
                            <li><strong>Passage 2:</strong> Steady pace. Use techniques from other modules. 19-20 minutes.</li>
                            <li><strong>Passage 3:</strong> Deploy ALL reserves. Accept 80% accuracy if it means finishing on time.</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* The 4-Step Passage 3 Protocol */}
            <section className="theory-section">
                <h3>
                    <Target size={20} />
                    The 4-Step Passage 3 Protocol
                </h3>

                <div className="protocol-steps">
                    <div className="protocol-step">
                        <div className="step-number">Step 1</div>
                        <div className="step-content">
                            <h4>Micro-Break Reset (30 seconds)</h4>
                            <p>
                                Before starting Passage 3, take a deliberate 30-second break. Close your eyes, take
                                3 deep breaths, and visualize crushing this passage. This resets your sympathetic
                                nervous system and gives you a ~10% cognitive boost.
                            </p>
                        </div>
                    </div>

                    <div className="protocol-step">
                        <div className="step-number">Step 2</div>
                        <div className="step-content">
                            <h4>Strategic Question Triage (2 minutes)</h4>
                            <p>
                                Scan all 13-14 questions and categorize them by cognitive cost:
                                <ul>
                                    <li><strong>LOW:</strong> Name matching, number matching, simple True/False (do these first)</li>
                                    <li><strong>MEDIUM:</strong> Summary completion, sentence completion</li>
                                    <li><strong>HIGH:</strong> TFNG with complex inference, matching headings</li>
                                </ul>
                                Do LOW → MEDIUM → HIGH. Never do them in passage order.
                            </p>
                        </div>
                    </div>

                    <div className="protocol-step">
                        <div className="step-number">Step 3</div>
                        <div className="step-content">
                            <h4>Aggressive Skimming (3 minutes max)</h4>
                            <p>
                                You don't have time to "understand" Passage 3. Skim for structure only:
                                <ul>
                                    <li>Read first sentence of each paragraph (topic sentences)</li>
                                    <li>Note transition words (however, furthermore, consequently)</li>
                                    <li>Identify where examples begin (for instance, such as)</li>
                                </ul>
                                Goal: Create a mental map of where information lives, not what it means.
                            </p>
                        </div>
                    </div>

                    <div className="protocol-step">
                        <div className="step-number">Step 4</div>
                        <div className="step-content">
                            <h4>Surgical Strike Answering (15 minutes)</h4>
                            <p>
                                Attack questions with precision:
                                <ul>
                                    <li><strong>90-Second Rule:</strong> If you can't solve it in 90 seconds, mark your best guess and move on</li>
                                    <li><strong>Keyword Anchoring:</strong> Use keywords to locate the relevant paragraph, then read ONLY that paragraph</li>
                                    <li><strong>No Backtracking:</strong> Once you've answered, don't second-guess unless you have 2+ minutes left</li>
                                </ul>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Mindset Shift */}
            <section className="theory-section">
                <h3>
                    <Trophy size={20} />
                    The Passage 3 Mindset Shift
                </h3>
                <div className="mindset-card">
                    <p>
                        Most candidates approach Passage 3 thinking: <em>"I need to get 13/13 correct."</em>
                        This is a trap. The math tells a different story:
                    </p>

                    <div className="math-breakdown">
                        <div className="math-item">
                            <strong>Band 7.0:</strong> 30-32 correct answers out of 40 total
                        </div>
                        <div className="math-item">
                            <strong>Band 7.5:</strong> 33-34 correct answers out of 40 total
                        </div>
                        <div className="math-item">
                            <strong>Band 8.0:</strong> 35-36 correct answers out of 40 total
                        </div>
                    </div>

                    <div className="mindset-shift-text">
                        <Zap size={18} className="inline-icon" />
                        <strong>The Shift:</strong> You can afford to get 4-5 questions wrong on Passage 3 and
                        still hit Band 7.5+, <em>if you nailed Passages 1 and 2</em>. Don't chase perfection on
                        Passage 3—chase completion. Answer all 13-14 questions with 80% confidence rather than
                        10 questions with 95% confidence.
                    </div>
                </div>
            </section>

            {/* Practice CTA */}
            <div className="theory-cta">
                <h4>Ready to Conquer Passage 3?</h4>
                <p>
                    Switch to <strong>Practice</strong> to apply the 4-Step Protocol on real Passage 3-level
                    texts, or try <strong>Battle Mode</strong> for full exam simulation under fatigue conditions.
                </p>
            </div>
        </motion.div>
    );
}
