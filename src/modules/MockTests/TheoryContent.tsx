import { motion } from 'framer-motion';
import { BookOpen, Trophy, AlertTriangle, Target, Zap, CheckCircle } from 'lucide-react';

export default function TheoryContent() {
    return (
        <motion.div
            className="theory-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2 className="theory-title">Full Mock Test Preparation</h2>

            <div className="theory-intro">
                <p>
                    Welcome to the <strong>ultimate proving ground</strong> for your IELTS Reading preparation.
                    This module features <strong>10 complete practice tests</strong>, each mirroring the actual
                    IELTS Academic Reading exam with authentic passages, question types, and timing constraints.
                </p>
            </div>

            {/* Why Mock Tests Matter */}
            <section className="theory-section">
                <h3>
                    <Target size={20} />
                    Why Mock Tests Are Essential
                </h3>
                <div className="importance-grid">
                    <div className="importance-card">
                        <div className="importance-icon">🎯</div>
                        <h4>Real Exam Simulation</h4>
                        <p>
                            Experience the exact format, length, and pressure of the actual test.
                            No surprises on exam day.
                        </p>
                    </div>
                    <div className="importance-card">
                        <div className="importance-icon">⏱️</div>
                        <h4>Time Management Mastery</h4>
                        <p>
                            Practice maintaining focus and pacing across the full 60-minute duration
                            with 3 passages and 40 questions.
                        </p>
                    </div>
                    <div className="importance-card">
                        <div className="importance-icon">🧠</div>
                        <h4>Stamina Building</h4>
                        <p>
                            Train your cognitive endurance to stay sharp through Passage 3,
                            when most test-takers mentally fatigue.
                        </p>
                    </div>
                    <div className="importance-card">
                        <div className="importance-icon">📊</div>
                        <h4>Performance Tracking</h4>
                        <p>
                            Identify patterns in your mistakes, track improvement over time,
                            and pinpoint areas that need more work.
                        </p>
                    </div>
                </div>
            </section>

            {/* What to Expect */}
            <section className="theory-section">
                <h3>
                    <BookOpen size={20} />
                    What Each Mock Test Includes
                </h3>
                <div className="test-structure">
                    <div className="structure-item">
                        <div className="structure-number">3</div>
                        <div className="structure-details">
                            <strong>Academic Passages</strong>
                            <p>2,150-2,750 words total across diverse topics (science, history, social issues)</p>
                        </div>
                    </div>
                    <div className="structure-item">
                        <div className="structure-number">40</div>
                        <div className="structure-details">
                            <strong>Questions</strong>
                            <p>All 10 IELTS question types: TFNG, Multiple Choice, Matching, Summary, etc.</p>
                        </div>
                    </div>
                    <div className="structure-item">
                        <div className="structure-number">60</div>
                        <div className="structure-details">
                            <strong>Minutes</strong>
                            <p>Strict time limit with countdown timer and passage-by-passage tracking</p>
                        </div>
                    </div>
                    <div className="structure-item">
                        <div className="structure-number">9.0</div>
                        <div className="structure-details">
                            <strong>Band Score</strong>
                            <p>Instant band score calculation using official IELTS scoring criteria</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Mock Test Strategy */}
            <section className="theory-section">
                <h3>
                    <Zap size={20} />
                    How to Use Mock Tests Effectively
                </h3>

                <div className="strategy-phase">
                    <h4>📋 Phase 1: Diagnostic Test (Test #1)</h4>
                    <p>Take your first mock test with zero preparation to establish your baseline:</p>
                    <ul className="strategy-checklist">
                        <li>Simulate real exam conditions (quiet environment, no distractions)</li>
                        <li>Use only a pen/pencil and the answer sheet</li>
                        <li>Record your band score and time spent per passage</li>
                        <li>Analyze which question types caused the most trouble</li>
                    </ul>
                </div>

                <div className="strategy-phase">
                    <h4>🎯 Phase 2: Targeted Training (Tests #2-4)</h4>
                    <p>After identifying weaknesses, focus on specific modules before returning to mock tests:</p>
                    <ul className="strategy-checklist">
                        <li>Work through relevant skill modules (TFNG, Paraphrasing, etc.)</li>
                        <li>Take one mock test per week to track improvement</li>
                        <li>Review each mistake thoroughly—understand WHY you got it wrong</li>
                        <li>Note recurring error patterns (e.g., falling for distractors in Passage 3)</li>
                    </ul>
                </div>

                <div className="strategy-phase">
                    <h4>⚡ Phase 3: Intensive Practice (Tests #5-8)</h4>
                    <p>Ramp up frequency and focus on exam-day readiness:</p>
                    <ul className="strategy-checklist">
                        <li>Take 2 mock tests per week under strict time pressure</li>
                        <li>Experiment with different time allocation strategies</li>
                        <li>Practice the answer transfer process (2 mins per passage)</li>
                        <li>Build mental stamina for maintaining focus across 60 minutes</li>
                    </ul>
                </div>

                <div className="strategy-phase">
                    <h4>🏆 Phase 4: Final Rehearsals (Tests #9-10)</h4>
                    <p>Perfect your exam-day routine in the final week:</p>
                    <ul className="strategy-checklist">
                        <li>Take tests at the same time as your actual exam (e.g., 9:00 AM)</li>
                        <li>Wear similar clothing, use same stationery</li>
                        <li>Aim for consistency: both tests should hit your target band score</li>
                        <li>Review only critical mistakes—avoid cramming new strategies</li>
                    </ul>
                </div>
            </section>

            {/* Band Score Breakdown */}
            <section className="theory-section">
                <h3>
                    <Trophy size={20} />
                    IELTS Band Score Conversion
                </h3>
                <div className="band-score-table">
                    <div className="band-row band-9">
                        <div className="band-number">9.0</div>
                        <div className="band-range">39-40 correct</div>
                        <div className="band-desc">Expert User</div>
                    </div>
                    <div className="band-row band-8">
                        <div className="band-number">8.5</div>
                        <div className="band-range">37-38 correct</div>
                        <div className="band-desc">Very Good User</div>
                    </div>
                    <div className="band-row band-8">
                        <div className="band-number">8.0</div>
                        <div className="band-range">35-36 correct</div>
                        <div className="band-desc">Very Good User</div>
                    </div>
                    <div className="band-row band-7">
                        <div className="band-number">7.5</div>
                        <div className="band-range">33-34 correct</div>
                        <div className="band-desc">Good User</div>
                    </div>
                    <div className="band-row band-7">
                        <div className="band-number">7.0</div>
                        <div className="band-range">30-32 correct</div>
                        <div className="band-desc">Good User</div>
                    </div>
                    <div className="band-row band-6">
                        <div className="band-number">6.5</div>
                        <div className="band-range">27-29 correct</div>
                        <div className="band-desc">Competent User</div>
                    </div>
                    <div className="band-row band-6">
                        <div className="band-number">6.0</div>
                        <div className="band-range">23-26 correct</div>
                        <div className="band-desc">Competent User</div>
                    </div>
                    <div className="band-row band-5">
                        <div className="band-number">5.5</div>
                        <div className="band-range">19-22 correct</div>
                        <div className="band-desc">Modest User</div>
                    </div>
                    <div className="band-row band-5">
                        <div className="band-number">5.0</div>
                        <div className="band-range">15-18 correct</div>
                        <div className="band-desc">Modest User</div>
                    </div>
                </div>
            </section>

            {/* Common Pitfalls */}
            <section className="theory-section pain-point-section">
                <h3>
                    <AlertTriangle size={20} />
                    Common Mock Test Mistakes to Avoid
                </h3>
                <div className="pitfall-list">
                    <div className="pitfall-item">
                        <div className="pitfall-icon">❌</div>
                        <div className="pitfall-content">
                            <strong>Taking Tests Back-to-Back</strong>
                            <p>
                                Allow 2-3 days between tests for proper review and recovery.
                                Marathon testing leads to burnout and diminishing returns.
                            </p>
                        </div>
                    </div>
                    <div className="pitfall-item">
                        <div className="pitfall-icon">❌</div>
                        <div className="pitfall-content">
                            <strong>Skipping the Review Process</strong>
                            <p>
                                Spend at least 30 minutes analyzing each test. Without review,
                                you'll repeat the same mistakes indefinitely.
                            </p>
                        </div>
                    </div>
                    <div className="pitfall-item">
                        <div className="pitfall-icon">❌</div>
                        <div className="pitfall-content">
                            <strong>Pausing the Timer</strong>
                            <p>
                                No matter what, never stop the clock. Real exams won't wait—
                                train yourself to push through distractions.
                            </p>
                        </div>
                    </div>
                    <div className="pitfall-item">
                        <div className="pitfall-icon">❌</div>
                        <div className="pitfall-content">
                            <strong>Fixating on Band Scores</strong>
                            <p>
                                Don't obsess over numerical results. Focus on understanding
                                the "how" and "why" behind each mistake.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Next Steps CTA */}
            <div className="theory-cta">
                <CheckCircle size={24} className="cta-icon" />
                <h4>Ready to Test Your Skills?</h4>
                <p>
                    Head to the <strong>Practice</strong> tab to select a mock test and begin your
                    60-minute journey. Remember: treat each test like the real exam, but use the
                    detailed feedback to improve continuously.
                </p>
                <p className="cta-emphasis">
                    🎯 <strong>Pro Tip:</strong> Schedule your mock tests at the same time as your
                    actual exam to build circadian rhythm and peak cognitive performance.
                </p>
            </div>
        </motion.div>
    );
}
