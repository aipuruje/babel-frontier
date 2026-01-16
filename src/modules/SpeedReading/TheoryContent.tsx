import { motion } from 'framer-motion';
import { AlertTriangle, Eye, Zap, TrendingUp } from 'lucide-react';

export default function TheoryContent() {
    return (
        <motion.div
            className="theory-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h2 className="theory-title">Speed Reading Fundamentals</h2>

            <div className="theory-intro">
                <p>
                    The average IELTS candidate reads at <strong>200-250 words per minute (WPM)</strong> with
                    full comprehension. However, IELTS Reading passages total <strong>2,750+ words</strong> across
                    3 passages, and you have only <strong>60 minutes</strong>. If you read at 200 WPM, you'll spend
                    <em>14 minutes just reading</em>—leaving only 46 minutes for 40 questions. This is why time
                    pressure crushes most candidates.
                </p>
            </div>

            {/* Pain Point */}
            <section className="theory-section pain-point-section">
                <h3>
                    <AlertTriangle size={20} />
                    The Reading Speed Bottleneck
                </h3>
                <div className="pain-point-card">
                    <h4>Why Slow Reading Kills Your Score</h4>
                    <p>
                        Band 7+ candidates typically read at <strong>300-350 WPM</strong> while maintaining 80%+
                        comprehension. This extra speed provides a critical buffer: more time to locate answers,
                        re-read confusing sections, and double-check responses. If you're stuck at 200 WPM, you're
                        fighting an impossible battle against the clock.
                    </p>

                    <div className="speed-comparison">
                        <div className="speed-scenario slow">
                            <div className="scenario-label">❌ 200 WPM Reader</div>
                            <div className="scenario-time">Reading: 14 min</div>
                            <div className="scenario-time">Questions: 46 min</div>
                            <div className="scenario-result">Rushed, anxious, incomplete</div>
                        </div>
                        <div className="speed-scenario fast">
                            <div className="scenario-label">✅ 350 WPM Reader</div>
                            <div className="scenario-time">Reading: 8 min</div>
                            <div className="scenario-time">Questions: 52 min</div>
                            <div className="scenario-result">Calm, thorough, confident</div>
                        </div>
                    </div>

                    <div className="critical-insight">
                        <strong>Critical Insight:</strong> Speed reading isn't about "skimming" or "guessing." It's
                        about training your eyes and brain to process text more efficiently. With proper technique,
                        you can double your reading speed <em>without</em> losing comprehension.
                    </div>
                </div>
            </section>

            {/* The 3 Speed Killers */}
            <section className="theory-section">
                <h3>
                    <Eye size={20} />
                    The 3 Speed Killers
                </h3>
                <p className="section-intro">
                    Most slow readers don't have a comprehension problem—they have inefficient eye movement habits
                    formed during childhood. Fixing these three issues can immediately boost your WPM.
                </p>

                <div className="speed-killers">
                    <div className="killer-card">
                        <div className="killer-number">1</div>
                        <div className="killer-content">
                            <h4>Subvocalization</h4>
                            <p className="killer-definition">
                                Silently "pronouncing" every word in your head as you read.
                            </p>
                            <p>
                                When you learned to read as a child, you said each word aloud. Over time, this became
                                internal speech. Your brain can comprehend text <strong>3-5x faster than you can speak</strong>,
                                but subvocalization artificially limits you to speaking speed (~200 WPM).
                            </p>
                            <div className="killer-solution">
                                <strong>Solution:</strong> Hum quietly while reading practice passages. This occupies
                                your vocal cords, forcing your brain to process visually without internal speech.
                            </div>
                        </div>
                    </div>

                    <div className="killer-card">
                        <div className="killer-number">2</div>
                        <div className="killer-content">
                            <h4>Word-by-Word Reading</h4>
                            <p className="killer-definition">
                                Reading one word at a time instead of processing chunks.
                            </p>
                            <p>
                                Your eye can capture <strong>4-5 words per fixation</strong>, but untrained readers focus
                                on individual words. This is like watching a movie one pixel at a time—technically possible,
                                but painfully slow.
                            </p>
                            <div className="killer-solution">
                                <strong>Solution:</strong> Train peripheral vision to capture word groups. Instead of
                                reading "The | cat | sat | on | the | mat," read "The cat sat | on the mat" (2 fixations).
                            </div>
                        </div>
                    </div>

                    <div className="killer-card">
                        <div className="killer-number">3</div>
                        <div className="killer-content">
                            <h4>Regression (Backtracking)</h4>
                            <p className="killer-definition">
                                Re-reading sentences because you "zoned out" or lacked confidence.
                            </p>
                            <p>
                                Studies show untrained readers backtrack <strong>10-15 times per page</strong>. Each
                                regression wastes 2-3 seconds. On a 3-passage IELTS test, this adds up to <em>5-7 lost
                                    minutes</em>.
                            </p>
                            <div className="killer-solution">
                                <strong>Solution:</strong> Use a pointer (finger/pen) to guide your eyes forward. Physical
                                pacing prevents regression and maintains momentum.
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The WPM Target System */}
            <section className="theory-section">
                <h3>
                    <TrendingUp size={20} />
                    The WPM Target System
                </h3>
                <p className="section-intro">
                    Progressive speed goals based on IELTS band requirements:
                </p>

                <div className="wpm-targets">
                    <div className="wpm-level level-beginner">
                        <div className="wpm-range">150-200 WPM</div>
                        <div className="wpm-band">Band 5-6</div>
                        <div className="wpm-desc">Baseline. Too slow for time management.</div>
                    </div>
                    <div className="wpm-level level-intermediate">
                        <div className="wpm-range">250-300 WPM</div>
                        <div className="wpm-band">Band 6.5-7</div>
                        <div className="wpm-desc">Competent. Can finish with minimal rush.</div>
                    </div>
                    <div className="wpm-level level-advanced">
                        <div className="wpm-range">350-400 WPM</div>
                        <div className="wpm-band">Band 7.5-8</div>
                        <div className="wpm-desc">Advanced. Ample time for rechecking.</div>
                    </div>
                    <div className="wpm-level level-expert">
                        <div className="wpm-range">450+ WPM</div>
                        <div className="wpm-band">Band 8.5-9</div>
                        <div className="wpm-desc">Expert. Finishes 10-15 min early.</div>
                    </div>
                </div>

                <div className="wpm-note">
                    <strong>Note:</strong> These speeds assume 80%+ comprehension. Speed without understanding
                    is useless. Practice exercises will track both metrics.
                </div>
            </section>

            {/* The 4-Step Speed Reading Protocol */}
            <section className="theory-section">
                <h3>
                    <Zap size={20} />
                    The 4-Step Speed Reading Protocol
                </h3>

                <div className="protocol-steps">
                    <div className="protocol-step">
                        <div className="step-number">1</div>
                        <div className="step-content">
                            <h4>Eliminate Subvocalization</h4>
                            <p>
                                <strong>Technique:</strong> Hum or chew gum while reading. Sounds silly, but it works.
                            </p>
                            <p>
                                <strong>Practice:</strong> Read 3-4 paragraphs daily while humming. Track if you maintain
                                comprehension.
                            </p>
                            <p>
                                <strong>Result:</strong> 50-100 WPM increase within 1 week.
                            </p>
                        </div>
                    </div>

                    <div className="protocol-step">
                        <div className="step-number">2</div>
                        <div className="step-content">
                            <h4>Chunk Word Groups</h4>
                            <p>
                                <strong>Technique:</strong> Force your eyes to pause only 2-3 times per line instead of
                                6-8 times.
                            </p>
                            <p>
                                <strong>Practice:</strong> Use a pen to mark fixation points (every 4-5 words). Train
                                your eyes to jump between marks.
                            </p>
                            <p>
                                <strong>Result:</strong> 75-150 WPM increase after 2 weeks.
                            </p>
                        </div>
                    </div>

                    <div className="protocol-step">
                        <div className="step-number">3</div>
                        <div className="step-content">
                            <h4>Stop Regression</h4>
                            <p>
                                <strong>Technique:</strong> Use your finger/pen as a physical pacer. Never move it backward.
                            </p>
                            <p>
                                <strong>Practice:</strong> Read passages with a timer. Cover already-read text with a card
                                so backtracking is impossible.
                            </p>
                            <p>
                                <strong>Result:</strong> 25-50 WPM increase immediately.
                            </p>
                        </div>
                    </div>

                    <div className="protocol-step">
                        <div className="step-number">4</div>
                        <div className="step-content">
                            <h4>Expand Peripheral Vision</h4>
                            <p>
                                <strong>Technique:</strong> Read down the center of the page, using peripheral vision to
                                capture words on edges.
                            </p>
                            <p>
                                <strong>Practice:</strong> Advanced. Only attempt after mastering steps 1-3.
                            </p>
                            <p>
                                <strong>Result:</strong> 100-200 WPM increase for experts.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Practice CTA */}
            <div className="theory-cta">
                <h4>Ready to Break Your Speed Limit?</h4>
                <p>
                    Switch to <strong>Practice</strong> to test timed reading with instant WPM calculation and
                    comprehension checks, or try <strong>Battle Mode</strong> for progressive speed challenges.
                </p>
            </div>
        </motion.div>
    );
}
