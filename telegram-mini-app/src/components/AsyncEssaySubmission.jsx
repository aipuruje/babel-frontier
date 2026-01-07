import { useState, useEffect, useRef } from 'react';
import './AsyncEssaySubmission.css';

/**
 * Async Essay Submission Component
 * Implements the "Antigravity" polling pattern for queue-based essay grading
 * 
 * Flow:
 * 1. User submits essay → Instant "Queued" response
 * 2. Component polls /api/submissions/:id every 3 seconds
 * 3. When COMPLETED, animate reveal of band score
 */
export default function AsyncEssaySubmission({ userId, username }) {
    const [essay, setEssay] = useState('');
    const [prompt] = useState('Some people believe that technology has made our lives more complicated. Others think it has made things easier. Discuss both views and give your opinion.'); // setPrompt unused - hardcoded prompt used

    // Submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionId, setSubmissionId] = useState(null);
    const [status, setStatus] = useState(null); // 'PENDING' | 'COMPLETED' | 'FAILED'

    // Results
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    // Polling
    const pollingInterval = useRef(null);
    const [pollCount, setPollCount] = useState(0);

    // Word count
    const wordCount = essay.trim().split(/\s+/).filter(w => w.length > 0).length;

    /**
     * Submit essay to async grading queue
     */
    const handleSubmit = async () => {
        if (wordCount < 50) {
            setError('Please write at least 50 words');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setResults(null);

        try {
            const response = await fetch('/api/writing/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    username,
                    essay,
                    prompt
                })
            });

            const data = await response.json();

            if (response.status === 202 && data.status === 'queued') {
                // Success! Essay is queued
                setSubmissionId(data.submissionId);
                setStatus('PENDING');

                // Start polling for results
                startPolling(data.submissionId);
            } else {
                throw new Error(data.error || 'Submission failed');
            }

        } catch (err) {
            console.error('Submission error:', err);
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    /**
     * Start polling for grading results
     */
    const startPolling = (subId) => {
        setPollCount(0);

        pollingInterval.current = setInterval(async () => {
            try {
                const response = await fetch(`/api/submissions/${subId}?userId=${userId}`);
                const data = await response.json();

                setPollCount(prev => prev + 1);

                if (data.status === 'COMPLETED') {
                    // Grading complete! Show results
                    setStatus('COMPLETED');
                    setResults(data);
                    setIsSubmitting(false);
                    stopPolling();
                } else if (data.status === 'FAILED') {
                    // Grading failed
                    setStatus('FAILED');
                    setError(data.error || 'Grading failed. Please try again.');
                    setIsSubmitting(false);
                    stopPolling();
                } else {
                    // Still pending
                    setStatus('PENDING');
                }

            } catch (err) {
                console.error('Polling error:', err);
                // Don't stop polling on network errors, might be temporary
            }
        }, 3000); // Poll every 3 seconds
    };

    /**
     * Stop polling
     */
    const stopPolling = () => {
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
        }
    };

    /**
     * Reset form
     */
    const handleReset = () => {
        setEssay('');
        setSubmissionId(null);
        setStatus(null);
        setResults(null);
        setError(null);
        setPollCount(0);
        stopPolling();
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => stopPolling();
    }, []);

    return (
        <div className="async-essay-submission">
            <h2>✍️ Writing Foundry</h2>
            <p className="subtitle">Submit your IELTS Task 2 essay for AI grading</p>

            {/* Essay Prompt */}
            <div className="prompt-box">
                <h3>📝 Essay Prompt</h3>
                <p>{prompt}</p>
            </div>

            {/* Essay Input */}
            {!submissionId && (
                <div className="essay-input">
                    <textarea
                        value={essay}
                        onChange={(e) => setEssay(e.target.value)}
                        placeholder="Write your essay here... (minimum 250 words for IELTS Task 2)"
                        rows={15}
                        disabled={isSubmitting}
                    />
                    <div className="word-count">
                        Words: {wordCount} / 250
                        {wordCount < 250 && <span className="warning"> (Below recommended minimum)</span>}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    ⚠️ {error}
                </div>
            )}

            {/* Submit Button */}
            {!submissionId && (
                <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitting || wordCount < 50}
                >
                    {isSubmitting ? '⏳ Submitting...' : '🚀 Submit Essay'}
                </button>
            )}

            {/* Grading Status */}
            {status === 'PENDING' && (
                <div className="grading-status">
                    <div className="spinner"></div>
                    <h3>🤖 AI Examiner is Reviewing Your Essay</h3>
                    <p>Your essay is being graded by our IELTS Master Examiner AI.</p>
                    <p className="poll-info">Polling for results... (Check #{pollCount})</p>
                    <div className="estimated-time">
                        ⏱️ Estimated time: 10-30 seconds
                    </div>
                </div>
            )}

            {/* Results */}
            {status === 'COMPLETED' && results && (
                <div className="results-container animate-reveal">

                    {/* Antigravity Reveal Banner */}
                    {results.feedback && results.feedback.aura_metadata && (
                        <div className={`aura-reveal-banner ${results.feedback.aura_metadata.stance.toLowerCase()}`}>
                            <div className="banner-content">
                                {results.feedback.aura_metadata.delta > 0 ? (
                                    <>
                                        <h3>🚀 The Momentum is Real!</h3>
                                        <p className="aura-text">
                                            "You’ve officially pushed your skills into a new bracket.
                                            That's Band {results.overall_band} energy right there. Ready to see the breakdown?"
                                        </p>
                                    </>
                                ) : results.feedback.aura_metadata.delta < 0 ? (
                                    <>
                                        <h3>🛠️ Mission Debrief: Complexity Unlocked.</h3>
                                        <p className="aura-text">
                                            "That prompt was a heavy lift, and it caught us on a few points.
                                            No stress—this is where the real growth happens. Let’s pivot."
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h3>💎 Stability is Your Superpower</h3>
                                        <p className="aura-text">
                                            "Holding a {results.overall_band} across different topics is a sign of true stability.
                                            You aren't just lucky; you are consistent."
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="band-score-display">
                        <h3>Your IELTS Band Score</h3>
                        <div className="band-score">{results.band_score}</div>
                        <div className="band-label">{getBandLabel(results.band_score)}</div>
                    </div>

                    <div className="criteria-scores">
                        <h4>📊 Detailed Scores</h4>
                        <div className="score-grid">
                            <div className="score-item">
                                <span className="label">Task Achievement</span>
                                <span className="score">{results.task_achievement}</span>
                            </div>
                            <div className="score-item">
                                <span className="label">Coherence & Cohesion</span>
                                <span className="score">{results.coherence}</span>
                            </div>
                            <div className="score-item">
                                <span className="label">Lexical Resource</span>
                                <span className="score">{results.vocabulary}</span>
                            </div>
                            <div className="score-item">
                                <span className="label">Grammar Range & Accuracy</span>
                                <span className="score">{results.grammar}</span>
                            </div>
                        </div>
                    </div>

                    {/* Feedback */}
                    {results.feedback && (
                        <div className="feedback-section">
                            <div className="feedback-summary">
                                <h4>💬 Examiner Feedback</h4>
                                <p>{results.feedback.summary}</p>
                            </div>

                            {results.feedback.strengths && results.feedback.strengths.length > 0 && (
                                <div className="strengths">
                                    <h5>✅ Strengths</h5>
                                    <ul>
                                        {results.feedback.strengths.map((strength, idx) => (
                                            <li key={idx}>{strength}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {results.feedback.actionable_improvements && results.feedback.actionable_improvements.length > 0 && (
                                <div className="improvements">
                                    <h5>🎯 Areas for Improvement</h5>
                                    <ul>
                                        {results.feedback.actionable_improvements.map((improvement, idx) => (
                                            <li key={idx}>{improvement}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {/* Aura Mentorship Section */}
                            {results.feedback.aura_mentorship && (
                                <div className="aura-mentorship-box">
                                    <h5>👤 Aura's Guidance</h5>
                                    <div className="aura-mentorship-content">
                                        {results.feedback.aura_mentorship}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Grading Stats */}
                    <div className="grading-stats">
                        <p>📝 Word count: {results.word_count}</p>
                        {results.momentum && (
                            <p className="momentum-stat">⚡ Momentum: {results.momentum}%</p>
                        )}
                        {results.grading_duration_seconds && (
                            <p>⏱️ Graded in {results.grading_duration_seconds} seconds</p>
                        )}
                    </div>

                    <button className="reset-btn" onClick={handleReset}>
                        📝 Write Another Essay
                    </button>
                </div>
            )}
        </div>
    );
}

/**
 * Get IELTS band label
 */
function getBandLabel(score) {
    if (score >= 9.0) return 'Expert User';
    if (score >= 8.5) return 'Very Good User+';
    if (score >= 8.0) return 'Very Good User';
    if (score >= 7.5) return 'Good User+';
    if (score >= 7.0) return 'Good User';
    if (score >= 6.5) return 'Competent User+';
    if (score >= 6.0) return 'Competent User';
    if (score >= 5.5) return 'Modest User+';
    if (score >= 5.0) return 'Modest User';
    return 'Limited User';
}
