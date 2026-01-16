import { motion } from 'framer-motion';
import { Clock, Zap, Target, AlertTriangle } from 'lucide-react';

export default function TheoryContent() {
    return (
        <motion.div
            className="theory-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2 className="theory-title">Mastering the 60-Minute Challenge</h2>

            <div className="theory-intro">
                <p>
                    The IELTS Academic Reading test gives you <strong>exactly 60 minutes</strong> to process
                    2,150-2,750 words across 3 passages and answer 40 questions. This isn't just a reading test—it's
                    a <strong>cognitive velocity challenge</strong>.
                </p>
            </div>

            {/* Pain Point */}
            <section className="theory-section pain-point-section">
                <h3>
                    <AlertTriangle size={20} />
                    The Core Problem
                </h3>
                <div className="pain-point-card">
                    <h4>The Double-Handling Trap</h4>
                    <p>
                        Unlike the Listening module (which gives you 10 extra minutes to transfer answers),
                        the Reading module forces you to transfer answers <em>during</em> the 60 minutes.
                        This creates a brutal choice:
                    </p>
                    <ul>
                        <li><strong>Transfer as you go</strong> → Breaks your reading flow every 90 seconds</li>
                        <li><strong>Transfer at the end</strong> → Risk running out of time or making panic errors</li>
                    </ul>
                    <div className="stat-highlight">
                        <Clock size={24} />
                        <div>
                            <strong>Effective Reading Time: 52-55 minutes</strong>
                            <p>5-8 minutes lost to answer transfer</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Math */}
            <section className="theory-section">
                <h3>
                    <Target size={20} />
                    The Mathematical Reality
                </h3>
                <div className="stat-grid">
                    <div className="stat-card-theory">
                        <div className="stat-number">2,500</div>
                        <div className="stat-label">Avg Words to Read</div>
                    </div>
                    <div className="stat-card-theory">
                        <div className="stat-number">40</div>
                        <div className="stat-label">Questions</div>
                    </div>
                    <div className="stat-card-theory">
                        <div className="stat-number">1.5</div>
                        <div className="stat-label">Min per Question</div>
                    </div>
                    <div className="stat-card-theory">
                        <div className="stat-number gradient-text">250+</div>
                        <div className="stat-label">Required WPM</div>
                    </div>
                </div>

                <div className="insight-box">
                    <strong>Critical Insight:</strong> If you read below 200 WPM, you physically cannot
                    finish the test. Candidates who try to "deep read" every sentence inevitably fail
                    to complete Passage 3.
                </div>
            </section>

            {/* The Strategy */}
            <section className="theory-section">
                <h3>
                    <Zap size={20} />
                    The Winning Time Strategy
                </h3>

                <div className="strategy-breakdown">
                    <h4>📊 Recommended Time Allocation</h4>

                    <div className="passage-timeline">
                        <div className="timeline-item">
                            <div className="timeline-marker passage-1">1</div>
                            <div className="timeline-content">
                                <strong>Passage 1: 18 minutes</strong>
                                <p>Usually descriptive/factual. Easier vocabulary. Build momentum here.</p>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-marker passage-2">2</div>
                            <div className="timeline-content">
                                <strong>Passage 2: 20 minutes</strong>
                                <p>More discursive. Moderate difficulty. Maintain pace.</p>
                            </div>
                        </div>

                        <div className="timeline-item">
                            <div className="timeline-marker passage-3">3</div>
                            <div className="timeline-content">
                                <strong>Passage 3: 22 minutes</strong>
                                <p>Abstract/argumentative. Hardest. You'll be tired—budget extra time.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="strategy-tips">
                    <h4>⚡ Power Techniques</h4>
                    <ul className="technique-list">
                        <li>
                            <strong>Answer Transfer Strategy:</strong> Transfer every 13-14 questions
                            (after each passage). Takes 2 minutes per transfer = 6 minutes total.
                        </li>
                        <li>
                            <strong>Strategic Guessing:</strong> If a question takes &gt; 2 minutes, mark your best
                            guess and move on. Come back only if time allows.
                        </li>
                        <li>
                            <strong>Reading Modes:</strong> Shift between skimming (headings), scanning
                            (specific details), and close reading (TFNG) based on question type.
                        </li>
                        <li>
                            <strong>The 5-Minute Rule:</strong> At 55 minutes, STOP problem-solving.
                            Spend final 5 minutes transferring/guessing remaining answers.
                        </li>
                    </ul>
                </div>
            </section>

            {/* Practice CTA */}
            <div className="theory-cta">
                <h4>Ready to Apply This?</h4>
                <p>
                    Switch to the <strong>Practice</strong> tab to test your time allocation with real passages,
                    or try <strong>Battle Mode</strong> for timed pressure training.
                </p>
            </div>
        </motion.div>
    );
}
