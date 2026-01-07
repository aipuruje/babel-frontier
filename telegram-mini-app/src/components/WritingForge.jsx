import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Writing Forge Component - 2026 Enhanced
 * Implements async grading with polling, categorized feedback, and progress tracking
 */
export default function WritingForge() {
    const navigate = useNavigate();

    // Writing state
    const [essay, setEssay] = useState('');
    const [prompt, setPrompt] = useState('');
    const [wordCount, setWordCount] = useState(0);

    // Grading state
    // const [submissionId, setSubmissionId] = useState(null); // Reserved for future use
    const [gradingStatus, setGradingStatus] = useState('idle'); // idle, submitting, pending, completed, failed
    const [gradingResult, setGradingResult] = useState(null);

    // UI state
    const [showResults, setShowResults] = useState(false);
    const [pollingInterval, setPollingInterval] = useState(null);

    // Sample prompts for quick start
    const samplePrompts = [
        "Some people believe that technology has made our lives easier, while others argue that it has created new problems. Discuss both views and give your opinion.",
        "Many governments think that economic progress is their most important goal. Some people, however, think that other types of progress are equally important for a country. Discuss both these views and give your own opinion.",
        "Some people say that the main environmental problem of our time is the loss of particular species of plants and animals. Others say that there are more important environmental problems. Discuss both these views and give your own opinion."
    ];

    // Update word count
    useEffect(() => {
        const words = essay.trim().split(/\s+/).filter(w => w.length > 0);
        setWordCount(words.length);
    }, [essay]);

    // Submit essay for grading
    async function submitEssay() {
        if (wordCount < 150) {
            alert('Essay must be at least 150 words for Task 1 or 250 words for Task 2');
            return;
        }

        try {
            setGradingStatus('submitting');

            const response = await fetch('/api/writing/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'writer_001',
                    essay,
                    prompt
                })
            });

            const data = await response.json();

            if (data.submissionId) {
                // setSubmissionId(data.submissionId); // Reserved for future use
                setGradingStatus('pending');
                startPolling(data.submissionId);
            } else {
                throw new Error(data.error || 'Submission failed');
            }

        } catch (error) {
            console.error('Submission error:', error);
            setGradingStatus('failed');
            alert('Failed to submit essay: ' + error.message);
        }
    }

    // Start polling for results
    function startPolling(id) {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/submissions/${id}`);
                const data = await response.json();

                if (data.status === 'COMPLETED') {
                    clearInterval(interval);
                    setGradingStatus('completed');
                    setGradingResult(data);
                    setShowResults(true);
                } else if (data.status === 'FAILED') {
                    clearInterval(interval);
                    setGradingStatus('failed');
                    alert('Grading failed: ' + (data.error || 'Unknown error'));
                }
                // If PENDING, continue polling
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 2000); // Poll every 2 seconds

        setPollingInterval(interval);

        // Timeout after 60 seconds
        setTimeout(() => {
            if (interval) {
                clearInterval(interval);
                if (gradingStatus === 'pending') {
                    setGradingStatus('failed');
                    alert('Grading is taking longer than expected. Please check back later.');
                }
            }
        }, 60000);
    }

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    // Load sample prompt
    function loadSamplePrompt(index) {
        setPrompt(samplePrompts[index]);
    }

    // Reset to write new essay
    function resetForm() {
        setEssay('');
        setPrompt('');
        // setSubmissionId(null); // Reserved for future use
        setGradingStatus('idle');
        setGradingResult(null);
        setShowResults(false);
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-black text-white p-6">
            {/* Header */}
            <div className="max-w-5xl mx-auto mb-6">
                <button
                    onClick={() => navigate('/home')}
                    className="px-4 py-2 bg-purple-800/50 rounded-lg hover:bg-purple-700 transition-all"
                >
                    ← Back to Home
                </button>
                <h1 className="text-4xl font-bold text-center mt-4 bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                    ✍️ Writing Forge - 2026 Enhanced
                </h1>
                <p className="text-center text-gray-300 mt-2">AI-Powered IELTS Writing Assistant</p>
            </div>

            {!showResults ? (
                // Writing Interface
                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Sample Prompts */}
                    <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-6 rounded-xl border border-purple-500">
                        <h2 className="text-xl font-bold mb-4">📝 Sample Prompts</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {samplePrompts.map((p, index) => (
                                <button
                                    key={index}
                                    onClick={() => loadSamplePrompt(index)}
                                    className="p-4 bg-purple-800/50 rounded-lg text-left hover:bg-purple-700 transition-all text-sm"
                                >
                                    {p.substring(0, 80)}...
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Essay Prompt */}
                    <div className="bg-black/40 p-6 rounded-xl border border-gray-700">
                        <label className="block text-lg font-bold mb-2">Essay Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-4 bg-gray-800 rounded-lg text-white border border-gray-600 focus:border-purple-500 outline-none"
                            rows="3"
                            placeholder="Enter the IELTS Writing Task 2 prompt..."
                        />
                    </div>

                    {/* Essay Editor */}
                    <div className="bg-black/40 p-6 rounded-xl border border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-lg font-bold">Your Essay</label>
                            <span className={`text-sm ${wordCount < 250 ? 'text-yellow-400' : 'text-green-400'}`}>
                                {wordCount} words {wordCount < 250 && '(minimum 250)'}
                            </span>
                        </div>
                        <textarea
                            value={essay}
                            onChange={(e) => setEssay(e.target.value)}
                            className="w-full p-4 bg-gray-800 rounded-lg text-white border border-gray-600 focus:border-purple-500 outline-none"
                            rows="15"
                            placeholder="Write your essay here..."
                            disabled={gradingStatus !== 'idle'}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="text-center">
                        {gradingStatus === 'idle' && (
                            <button
                                onClick={submitEssay}
                                disabled={wordCount < 150 || !prompt}
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                🚀 Submit for AI Grading
                            </button>
                        )}

                        {(gradingStatus === 'submitting' || gradingStatus === 'pending') && (
                            <div className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-xl shadow-lg inline-block">
                                <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                    <span>
                                        {gradingStatus === 'submitting' ? 'Submitting...' : 'AI Examiner is grading your essay...'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // Results Display
                <GradingResults result={gradingResult} onReset={resetForm} />
            )}
        </div>
    );
}

/**
 * Grading Results Component
 * Displays categorized feedback and recommendations
 */
function GradingResults({ result, onReset }) {
    const { band_score, task_achievement, coherence, vocabulary, grammar, feedback, detailed_corrections, improvement_priority } = result;

    // Group corrections by category
    const corrections = detailed_corrections || [];
    const graErrors = corrections.filter(c => c.category === 'GRA');
    const lrErrors = corrections.filter(c => c.category === 'LR');
    const ccErrors = corrections.filter(c => c.category === 'CC');
    const trErrors = corrections.filter(c => c.category === 'TR');

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Overall Band Score */}
            <div className="bg-gradient-to-r from-yellow-900/40 to-purple-900/40 p-8 rounded-xl border border-yellow-500 text-center">
                <h2 className="text-2xl font-bold mb-4">🎯 Your IELTS Band Score</h2>
                <div className="text-7xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                    {band_score}
                </div>
                <p className="text-xl mt-4 text-gray-300">{feedback?.summary || 'Analysis complete'}</p>
            </div>

            {/* Criteria Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ScoreCard title="Task Response" score={task_achievement} icon="📝" />
                <ScoreCard title="Coherence" score={coherence} icon="🔗" />
                <ScoreCard title="Vocabulary" score={vocabulary} icon="📖" />
                <ScoreCard title="Grammar" score={grammar} icon="✍️" />
            </div>

            {/* Strengths */}
            {feedback?.strengths && feedback.strengths.length > 0 && (
                <div className="bg-green-900/30 p-6 rounded-xl border border-green-500">
                    <h3 className="text-xl font-bold mb-4">💪 Strengths</h3>
                    <ul className="space-y-2">
                        {feedback.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span>✅</span>
                                <span>{strength}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Improvements */}
            {feedback?.actionable_improvements && feedback.actionable_improvements.length > 0 && (
                <div className="bg-yellow-900/30 p-6 rounded-xl border border-yellow-500">
                    <h3 className="text-xl font-bold mb-4">📊 Areas for Improvement</h3>
                    <ul className="space-y-2">
                        {feedback.actionable_improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span>💡</span>
                                <span>{improvement}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Categorized Corrections */}
            {corrections.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold">🔍 Detailed Corrections</h3>

                    {graErrors.length > 0 && (
                        <CorrectionCategory title="Grammar (GRA)" corrections={graErrors} color="red" />
                    )}

                    {lrErrors.length > 0 && (
                        <CorrectionCategory title="Vocabulary (LR)" corrections={lrErrors} color="blue" />
                    )}

                    {ccErrors.length > 0 && (
                        <CorrectionCategory title="Coherence (CC)" corrections={ccErrors} color="purple" />
                    )}

                    {trErrors.length > 0 && (
                        <CorrectionCategory title="Task Response (TR)" corrections={trErrors} color="yellow" />
                    )}
                </div>
            )}

            {/* Recommendation */}
            {improvement_priority && (
                <div className="bg-gradient-to-r from-pink-900/40 to-purple-900/40 p-6 rounded-xl border border-pink-500">
                    <h3 className="text-xl font-bold mb-4">🎯 Recommended Next Mission</h3>
                    <MissionRecommendation priority={improvement_priority} />
                </div>
            )}

            {/* Actions */}
            <div className="text-center space-x-4">
                <button
                    onClick={onReset}
                    className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-xl hover:scale-105 transition-all shadow-lg"
                >
                    ✍️ Write Another Essay
                </button>
            </div>
        </div>
    );
}

function ScoreCard({ title, score, icon }) {
    const color = score >= 7 ? 'green' : score >= 5.5 ? 'yellow' : 'red';

    return (
        <div className={`bg-${color}-900/30 p-4 rounded-xl border border-${color}-500`}>
            <div className="text-3xl mb-2">{icon}</div>
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-sm text-gray-300">{title}</div>
        </div>
    );
}

function CorrectionCategory({ title, corrections, color }) {
    return (
        <div className={`bg-${color}-900/20 p-4 rounded-xl border border-${color}-500/50`}>
            <h4 className="font-bold mb-3">{title} ({corrections.length})</h4>
            <div className="space-y-3">
                {corrections.map((correction, index) => (
                    <div key={index} className="bg-black/30 p-3 rounded-lg">
                        <div className="flex items-start gap-2 mb-1">
                            <span className="text-red-400">❌</span>
                            <span className="line-through text-gray-400">{correction.original}</span>
                        </div>
                        <div className="flex items-start gap-2 mb-1">
                            <span className="text-green-400">✅</span>
                            <span className="text-green-300">{correction.correction}</span>
                        </div>
                        <div className="text-sm text-gray-400 ml-6">
                            💡 {correction.reason}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function MissionRecommendation({ priority }) {
    const missions = {
        'GRA': {
            title: '⚔️ Grammar Boss: Complex Sentences',
            description: 'Master subordinate clauses, conditional forms, and advanced grammar structures',
            difficulty: 'Band 6.0 → 7.5'
        },
        'LR': {
            title: '📚 Vocabulary Forge: Academic Collocations',
            description: 'Learn natural word combinations and idiomatic expressions for IELTS Writing',
            difficulty: 'Band 6.0 → 7.5'
        },
        'CC': {
            title: '🔗 Coherence Master: Paragraph Structuring',
            description: 'Practice topic sentences, discourse markers, and logical flow',
            difficulty: 'Band 6.0 → 7.5'
        },
        'TR': {
            title: '🎯 Task Response Pro: Argumentation Skills',
            description: 'Develop clear positions with relevant examples and balanced arguments',
            difficulty: 'Band 6.0 → 7.5'
        }
    };

    const mission = missions[priority] || missions['GRA'];

    return (
        <div className="bg-black/30 p-6 rounded-lg">
            <h4 className="text-xl font-bold mb-2">{mission.title}</h4>
            <p className="text-gray-300 mb-3">{mission.description}</p>
            <div className="flex items-center justify-between">
                <span className="text-sm text-purple-400">{mission.difficulty}</span>
                <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-bold hover:scale-105 transition-all">
                    Start Mission →
                </button>
            </div>
        </div>
    );
}
