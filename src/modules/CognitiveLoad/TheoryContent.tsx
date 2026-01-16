import { motion } from 'framer-motion';
import { Brain, AlertTriangle, Zap, Shield, CheckCircle2 } from 'lucide-react';

export default function TheoryContent() {
    return (
        <motion.div
            className="theory-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2 className="theory-title">Cognitive Load Management</h2>

            <div className="theory-intro">
                <p>
                    IELTS Reading isn't just a test of English—it's a <strong>60-minute mental marathon</strong> that
                    pushes cognitive capacity to its limit. By Question 25, most candidates experience decision fatigue:
                    slower processing, reduced accuracy, and mounting anxiety. Understanding and managing cognitive load
                    is the difference between finishing strong or collapsing under mental exhaustion.
                </p>
            </div>

            {/* Pain Point */}
            <section className="theory-section pain-point-section">
                <h3>
                    <AlertTriangle size={20} />
                    The Mental Exhaustion Wall
                </h3>
                <div className="pain-point-card">
                    <h4>Why Question 25 Breaks Most Candidates</h4>
                    <p>
                        Research shows that cognitive performance degrades significantly after <strong>45 minutes of continuous
                            mental effort</strong>. IELTS Reading requires 40 decisions (answers) within 60 minutes while processing
                        dense academic text. Each decision—matching headings, identifying paraphrases, judging TFNG logic—drains
                        your limited cognitive resources.
                    </p>

                    <div className="fatigue-timeline">
                        <div className="timeline-stage fresh">
                            <div className="stage-time">0-20 min</div>
                            <div className="stage-label">Fresh Start</div>
                            <div className="stage-desc">90-95% cognitive capacity, quick decisions</div>
                        </div>
                        <div className="timeline-stage declining">
                            <div className="stage-time">20-40 min</div>
                            <div className="stage-label">Fatigue Onset</div>
                            <div className="stage-desc">70-80% capacity, slower processing, first mistakes</div>
                        </div>
                        <div className="timeline-stage critical">
                            <div className="stage-time">40-60 min</div>
                            <div className="stage-label">Critical Zone</div>
                            <div className="stage-desc">50-60% capacity, panic, rushed errors</div>
                        </div>
                    </div>

                    <div className="critical-insight">
                        <strong>Critical Insight:</strong> Band 7+ candidates don't fight mental fatigue—they design their
                        exam strategy to minimize cognitive load. They automate decisions, conserve mental energy for hard
                        questions, and use strategic breaks to reset focus.
                    </div>
                </div>
            </section>

            {/* Cognitive Load Types */}
            <section className="theory-section">
                <h3>
                    <Brain size={20} />
                    The 3 Types of Cognitive Load
                </h3>
                <p className="section-intro">
                    Not all mental effort is equal. Cognitive science identifies three types of load. Understanding them
                    lets you eliminate wasteful thinking and focus energy on what matters.
                </p>

                <div className="load-types">
                    <div className="load-card intrinsic">
                        <div className="load-icon">🎯</div>
                        <div className="load-content">
                            <h4>1. Intrinsic Load</h4>
                            <p className="load-definition">
                                The inherent difficulty of the material itself.
                            </p>
                            <p>
                                Example: Understanding a passage about quantum physics is intrinsically harder than one about
                                recycling. <strong>You can't reduce this</strong>—accept that Passage 3 will always be tougher.
                            </p>
                            <div className="load-strategy">
                                <strong>Strategy:</strong> Don't waste time trying to fully "understand" complex passages. Extract
                                only the information needed to answer questions.
                            </div>
                        </div>
                    </div>

                    <div className="load-card extraneous">
                        <div className="load-icon">❌</div>
                        <div className="load-content">
                            <h4>2. Extraneous Load</h4>
                            <p className="load-definition">
                                Wasted mental effort on irrelevant activities.
                            </p>
                            <p>
                                Example: Re-reading entire paragraphs to find one detail, second-guessing obvious answers,
                                highlighting excessively. This is <strong>self-inflicted exhaustion</strong>.
                            </p>
                            <div className="load-strategy">
                                <strong>Strategy:</strong> Eliminate all non-essential cognitive tasks. Use trained reflexes
                                (scan keywords, match patterns) instead of deep analysis.
                            </div>
                        </div>
                    </div>

                    <div className="load-card germane">
                        <div className="load-icon">✅</div>
                        <div className="load-content">
                            <h4>3. Germane Load</h4>
                            <p className="load-definition">
                                Productive mental effort that builds understanding and solves problems.
                            </p>
                            <p>
                                Example: Comparing heading options against paragraph themes, evaluating whether a statement is
                                "Not Given" vs. "False." This is <strong>valuable thinking</strong>.
                            </p>
                            <div className="load-strategy">
                                <strong>Strategy:</strong> Maximize time spent on germane load by ruthlessly cutting intrinsic and
                                extraneous load.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Energy Conservation Tactics */}
            <section className="theory-section">
                <h3>
                    <Shield size={20} />
                    5 Energy Conservation Tactics
                </h3>

                <div className="tactics-grid">
                    <div className="tactic-card">
                        <div className="tactic-number">1</div>
                        <h4>Automate Easy Questions</h4>
                        <p>
                            Name matching, number matching, and simple True/False should take <strong>30 seconds or less</strong>.
                            Train these as reflexes so your working memory is free for complex tasks.
                        </p>
                    </div>

                    <div className="tactic-card">
                        <div className="tactic-number">2</div>
                        <h4>Use the 90-Second Rule</h4>
                        <p>
                            If a question isn't solved in 90 seconds, <strong>flag and move on</strong>. Spending 5 minutes on one
                            question guarantees you'll rush (and fail) the last 5 questions.
                        </p>
                    </div>

                    <div className="tactic-card">
                        <div className="tactic-number">3</div>
                        <h4>Strategic Micro-Breaks</h4>
                        <p>
                            After completing each passage (13-15 questions), take a <strong>10-second mental reset</strong>. Close
                            your eyes, take 3 deep breaths. This prevents fatigue accumulation.
                        </p>
                    </div>

                    <div className="tactic-card">
                        <div className="tactic-number">4</div>
                        <h4>Prioritize by Cognitive Cost</h4>
                        <p>
                            Do low-cost questions first (name matching, diagram completion), then medium (heading matching), then
                            high-cost (TFNG, summary completion). Earn easy points while fresh.
                        </p>
                    </div>

                    <div className="tactic-card">
                        <div className="tactic-number">5</div>
                        <h4>Eliminate Choice Paralysis</h4>
                        <p>
                            For multiple-choice, <strong>cross out obviously wrong answers first</strong>. Choosing between 2 options
                            uses 60% less cognitive energy than evaluating 4 options simultaneously.
                        </p>
                    </div>
                </div>
            </section>

            {/* Decision Fatigue Prevention */}
            <section className="theory-section">
                <h3>
                    <Zap size={20} />
                    The Decision Fatigue Protocol
                </h3>
                <p className="section-intro">
                    Every decision you make—even tiny ones—depletes willpower. Here's how to minimize decision count:
                </p>

                <div className="protocol-list">
                    <div className="protocol-item">
                        <CheckCircle2 size={18} className="check-icon" />
                        <div className="protocol-text">
                            <strong>Pre-decide your passage order:</strong> Always do Passage 1 → 2 → 3. Don't waste energy deciding "which passage looks easier."
                        </div>
                    </div>

                    <div className="protocol-item">
                        <CheckCircle2 size={18} className="check-icon" />
                        <div className="protocol-text">
                            <strong>Pre-decide time allocations:</strong> 18 min, 20 min, 22 min. Stick to it. No in-test negotiations.
                        </div>
                    </div>

                    <div className="protocol-item">
                        <CheckCircle2 size={18} className="check-icon" />
                        <div className="protocol-text">
                            <strong>Use "good enough" answers:</strong> If you're 80% confident, mark it and move on. Perfectionism is a cognitive drain.
                        </div>
                    </div>

                    <div className="protocol-item">
                        <CheckCircle2 size={18} className="check-icon" />
                        <div className="protocol-text">
                            <strong>Batch similar questions:</strong> If a passage has 3 TFNG and 4 matching, do all TFNG first. Context-switching kills efficiency.
                        </div>
                    </div>

                    <div className="protocol-item">
                        <CheckCircle2 size={18} className="check-icon" />
                        <div className="protocol-text">
                            <strong>Trust first instincts on borderline calls:</strong> Your subconscious often catches patterns your conscious mind misses. Changing answers usually makes things worse.
                        </div>
                    </div>
                </div>
            </section>

            {/* Practice CTA */}
            <div className="theory-cta">
                <h4>Ready to Train Your Mental Stamina?</h4>
                <p>
                    Switch to <strong>Practice</strong> to apply cognitive load strategies on real passages, or try
                    <strong>Battle Mode</strong> for endurance training under simulated fatigue conditions.
                </p>
            </div>
        </motion.div>
    );
}
