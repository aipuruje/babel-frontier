import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import UzbekPattern from './UzbekPattern';

const WRITING_PROMPTS = [
    {
        id: 1,
        title: "Describe Your Hometown",
        difficulty: "Band 5.0",
        prompt: "Write about your hometown. Include:\n• Where it is located\n• What it looks like\n• What makes it special\n• Your favorite place there\n\nMin: 150 words",
        word_target: 150,
        xp_reward: 250,
        icon: "🏛️"
    },
    {
        id: 2,
        title: "Technology and Society",
        difficulty: "Band 7.0",
        prompt: "Some people believe technology makes us less social. Others disagree.\n\nDiscuss both views and give your opinion.\n\nMin: 250 words",
        word_target: 250,
        xp_reward: 400,
        icon: "📱"
    }
];

export default function WritingFortress() {
    const [selectedTask, setSelectedTask] = useState(null);
    const [essay, setEssay] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const wordCount = essay.trim().split(/\s+/).filter(w => w.length > 0).length;

    const submitEssay = async () => {
        if (!selectedTask) return;

        setIsAnalyzing(true);

        try {
            // Call Gemini API for essay analysis
            const response = await fetch('/api/analyze-writing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    essay: essay,
                    prompt: selectedTask.prompt,
                    word_target: selectedTask.word_target
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setAnalysis(data);
            setShowResults(true);
        } catch (error) {
            console.error('Analysis error:', error);
            // Fallback to basic analysis
            const hasIntro = essay.toLowerCase().includes('introduction') || wordCount > 50;
            const hasConclusion = essay.toLowerCase().includes('conclusion') || essay.toLowerCase().includes('in conclusion');
            const meetsWordCount = wordCount >= selectedTask.word_target;
            const score = [hasIntro, hasConclusion, meetsWordCount].filter(Boolean).length;

            setAnalysis({
                score,
                wordCount,
                hasIntro,
                hasConclusion,
                meetsWordCount,
                band_score: 5.0,
                task_achievement: 5,
                coherence: 5,
                vocabulary: 5,
                grammar: 5,
                feedback: 'Analysis temporarily unavailable. Basic scoring applied.',
                strengths: [],
                errors: []
            });
            setShowResults(true);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetTask = () => {
        setSelectedTask(null);
        setEssay('');
        setShowResults(false);
        setAnalysis(null);
    };

    if (selectedTask) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 relative overflow-hidden">
                <UzbekPattern variant="registan" opacity={0.05} />

                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <button
                            onClick={resetTask}
                            className="mb-4 text-orange-400 hover:text-orange-300 text-sm"
                        >
                            ← Back to Citadel
                        </button>
                        <h2 className="text-3xl font-bold text-center mb-2">
                            {selectedTask.icon} {selectedTask.title}
                        </h2>
                        <div className="text-center mt-2">
                            <span className="text-sm px-3 py-1 bg-orange-500 text-black rounded-full font-bold">
                                {selectedTask.difficulty}
                            </span>
                        </div>
                    </motion.div>

                    {!showResults ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Prompt */}
                            <div className="bg-orange-900/20 border-2 border-orange-500 rounded-xl p-6">
                                <h3 className="text-lg font-bold mb-4 text-orange-400">📝 Your Task</h3>
                                <div className="whitespace-pre-line leading-relaxed text-zinc-200">
                                    {selectedTask.prompt}
                                </div>
                            </div>

                            {/* Writing Area */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-orange-400">✍️ Your Essay</h3>
                                    <div className={`text-sm font-bold ${wordCount >= selectedTask.word_target ? 'text-green-400' : 'text-zinc-400'}`}>
                                        {wordCount} / {selectedTask.word_target} words
                                    </div>
                                </div>

                                <textarea
                                    value={essay}
                                    onChange={(e) => setEssay(e.target.value)}
                                    className="w-full h-96 bg-zinc-800 border-2 border-zinc-700 focus:border-orange-400 rounded-xl p-4 text-white resize-none focus:outline-none"
                                    placeholder="Begin writing your essay here..."
                                />

                                <button
                                    onClick={submitEssay}
                                    disabled={wordCount < 50 || isAnalyzing}
                                    className={`w-full font-bold py-4 rounded-xl transition-all ${wordCount < 50 || isAnalyzing
                                        ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg'
                                        }`}
                                >
                                    {isAnalyzing ? '🤖 AI Analyzing...' : '🏰 Build Fortress'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-zinc-800 rounded-xl p-8 border-2 border-orange-500"
                        >
                            <h3 className="text-3xl font-bold text-center mb-6 text-orange-400">
                                🏰 AI Fortress Analysis
                            </h3>

                            {/* Band Score */}
                            {analysis.band_score && (
                                <div className="text-center mb-6">
                                    <div className="text-6xl font-bold text-orange-400">
                                        {analysis.band_score}
                                    </div>
                                    <div className="text-sm text-zinc-400 mt-2">Overall Band Score</div>
                                </div>
                            )}

                            {/* IELTS 4 Criteria */}
                            {(analysis.task_achievement || analysis.coherence || analysis.vocabulary || analysis.grammar) && (
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {analysis.task_achievement && (
                                        <div className="bg-gradient-to-br from-blue-900/30 to-blue-700/30 border border-blue-500/50 p-3 rounded-lg">
                                            <div className="text-xs text-zinc-400 mb-1">Task Achievement</div>
                                            <div className="text-2xl font-bold text-blue-400">{analysis.task_achievement}/9</div>
                                        </div>
                                    )}
                                    {analysis.coherence && (
                                        <div className="bg-gradient-to-br from-green-900/30 to-green-700/30 border border-green-500/50 p-3 rounded-lg">
                                            <div className="text-xs text-zinc-400 mb-1">Coherence & Cohesion</div>
                                            <div className="text-2xl font-bold text-green-400">{analysis.coherence}/9</div>
                                        </div>
                                    )}
                                    {analysis.vocabulary && (
                                        <div className="bg-gradient-to-br from-purple-900/30 to-purple-700/30 border border-purple-500/50 p-3 rounded-lg">
                                            <div className="text-xs text-zinc-400 mb-1">Lexical Resource</div>
                                            <div className="text-2xl font-bold text-purple-400">{analysis.vocabulary}/9</div>
                                        </div>
                                    )}
                                    {analysis.grammar && (
                                        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-700/30 border border-yellow-500/50 p-3 rounded-lg">
                                            <div className="text-xs text-zinc-400 mb-1">Grammar & Accuracy</div>
                                            <div className="text-2xl font-bold text-yellow-400">{analysis.grammar}/9</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AI Feedback */}
                            <div className="bg-zinc-900 rounded-lg p-6 mb-6">
                                <h4 className="font-bold mb-3 flex items-center gap-2">
                                    <span>✨</span> AI Feedback
                                </h4>
                                <p className="text-zinc-300 leading-relaxed">{analysis.feedback || 'Good work!'}</p>
                                <div className="mt-4 text-sm text-zinc-400">
                                    <div>Total Words: <span className="text-white font-bold">{analysis.wordCount}</span></div>
                                </div>
                            </div>

                            {/* Errors */}
                            {analysis.errors && analysis.errors.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-bold mb-3 text-red-400 flex items-center gap-2">
                                        <span>⚠️</span> Areas for Improvement
                                    </h4>
                                    <div className="space-y-2">
                                        {analysis.errors.map((error, i) => (
                                            <div key={i} className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg text-sm">
                                                <span className="text-red-400">•</span> {error}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Strengths */}
                            {analysis.strengths && analysis.strengths.length > 0 && (
                                <div className="mb-6">
                                    <h4 className="font-bold mb-3 text-green-400 flex items-center gap-2">
                                        <span>✅</span> Strengths
                                    </h4>
                                    <div className="space-y-2">
                                        {analysis.strengths.map((strength, i) => (
                                            <div key={i} className="bg-green-900/20 border border-green-500/30 p-3 rounded-lg text-sm">
                                                <span className="text-green-400">•</span> {strength}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* XP Reward */}
                            <div className="text-center mb-6">
                                <div className="text-yellow-400 text-2xl font-bold">
                                    +{Math.floor(selectedTask.xp_reward * ((analysis.band_score || 5) / 9))} XP
                                </div>
                            </div>

                            <button
                                onClick={resetTask}
                                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 rounded-xl hover:shadow-lg transition-all"
                            >
                                Return to Citadel
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        );
    }

    // Task Selection
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 relative overflow-hidden">
            <UzbekPattern variant="samarkand" opacity={0.06} />

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent mb-2">
                        🏰 The Citadel
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        IELTS Writing Missions - Construct your defenses with words
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {WRITING_PROMPTS.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => setSelectedTask(task)}
                            className="bg-zinc-800 rounded-xl p-6 border border-zinc-700 hover:border-orange-400 cursor-pointer transition-all hover:scale-105"
                        >
                            <div className="text-5xl text-center mb-4">{task.icon}</div>
                            <h3 className="text-xl font-bold text-center mb-2">{task.title}</h3>
                            <p className="text-sm text-zinc-400 text-center mb-4">
                                Minimum {task.word_target} words
                            </p>
                            <div className="flex justify-between items-center text-xs">
                                <span className="px-2 py-1 bg-orange-500 text-black rounded font-bold">{task.difficulty}</span>
                                <span className="text-yellow-400">+{task.xp_reward} XP</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-8 bg-orange-900/20 border border-orange-500 rounded-xl p-6 text-center">
                    <p className="text-sm text-zinc-300">
                        💡 <strong>Coming Soon:</strong> AI-powered essay feedback using Gemini 2.5!<br />
                        Detailed grammar, coherence, and vocabulary analysis.
                    </p>
                </div>
            </div>
        </div>
    );
}
