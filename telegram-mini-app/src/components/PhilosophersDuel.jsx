import { useState, useEffect } from 'react';

const PhilosophersDuel = () => {
    const [debate, setDebate] = useState(null);
    const [selectedPhilosopher, setSelectedPhilosopher] = useState(null);
    const [argument, setArgument] = useState('');
    const [conversationHistory, setConversationHistory] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);

    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user';

    const philosophers = [
        {
            id: 'socrates',
            name: 'Socrates',
            emoji: '🧠',
            title: 'The Questioner',
            description: 'Ancient Greek philosopher. Will expose flaws in your logic through questioning.'
        },
        {
            id: 'al_khwarizmi',
            name: 'Al-Khwarizmi',
            emoji: '📐',
            title: 'The Mathematician',
            description: 'Persian polymath. Will challenge you with precise analytical reasoning.'
        },
        {
            id: 'steve_jobs',
            name: 'Steve Jobs',
            emoji: '💡',
            title: 'The Innovator',
            description: 'Visionary entrepreneur. Will challenge assumptions with innovative thinking.'
        }
    ];

    const startDebate = async (philosopher) => {
        try {
            const response = await fetch('/api/debate/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, philosopher: philosopher.id })
            });

            const data = await response.json();
            setDebate(data);
            setSelectedPhilosopher(philosopher);
            setConversationHistory([{
                speaker: 'system',
                text: `Task: ${data.prompt}`,
                type: 'prompt'
            }]);
        } catch (error) {
            console.error('Start debate error:', error);
            alert('Failed to start debate');
        }
    };

    const submitArgument = async () => {
        if (!argument.trim() || !debate) return;

        setIsAnalyzing(true);
        setConversationHistory(prev => [...prev, {
            speaker: 'student',
            text: argument,
            type: 'argument'
        }]);

        try {
            // Submit argument for analysis
            const analysisResponse = await fetch('/api/debate/submit-argument', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ debateId: debate.debate_id, argumentText: argument })
            });

            const analysisData = await analysisResponse.json();
            setAnalysisResult(analysisData.analysis);

            // Get philosopher's counterargument
            const counterResponse = await fetch('/api/debate/counterargument', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ debateId: debate.debate_id })
            });

            const counterData = await counterResponse.json();

            setConversationHistory(prev => [...prev, {
                speaker: 'ai',
                text: counterData.counterargument,
                type: 'counterargument',
                philosopher: selectedPhilosopher.name
            }]);

            setArgument('');
        } catch (error) {
            console.error('Submit argument error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!selectedPhilosopher) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-6">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        ⚔️ The Philosopher's Duel
                    </h1>
                    <p className="text-slate-300 text-lg">
                        Debate AI masters to forge your IELTS Task 2 arguments
                    </p>
                </div>

                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                    {philosophers.map(philosopher => (
                        <div
                            key={philosopher.id}
                            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-purple-500/50 transition-all hover:scale-105 cursor-pointer"
                            onClick={() => startDebate(philosopher)}
                        >
                            <div className="text-center">
                                <div className="text-7xl mb-4">{philosopher.emoji}</div>
                                <h3 className="text-2xl font-bold mb-2">{philosopher.name}</h3>
                                <div className="text-sm text-purple-300 font-bold mb-4">{philosopher.title}</div>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {philosopher.description}
                                </p>
                                <button className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 font-bold rounded-xl transition-all">
                                    Challenge {philosopher.name}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                <div className="max-w-3xl mx-auto mt-16 bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h3 className="font-bold text-white mb-4 text-xl">🎯 How The Duel Works:</h3>
                    <ol className="space-y-3 list-decimal list-inside text-slate-300">
                        <li>Choose your opponent philosopher</li>
                        <li>Receive an IELTS Task 2 prompt (e.g., "Is space exploration worth the cost?")</li>
                        <li>Present your argument</li>
                        <li>The AI will challenge your logic and point out fallacies</li>
                        <li>Counter using complex structures: <span className="text-purple-400 font-bold">Although...</span>, <span className="text-pink-400 font-bold">While...</span>, <span className="text-yellow-400 font-bold">If...then...</span></li>
                        <li>Win 3 debates to unlock <strong className="text-yellow-400">Enlightened Scribe</strong> rank</li>
                    </ol>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-6">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl">{selectedPhilosopher.emoji}</span>
                        <div>
                            <h2 className="text-3xl font-bold">Dueling with {selectedPhilosopher.name}</h2>
                            <p className="text-sm text-purple-300">{selectedPhilosopher.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedPhilosopher(null);
                            setDebate(null);
                            setConversationHistory([]);
                        }}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg transition-all"
                    >
                        🚪 Change Opponent
                    </button>
                </div>
            </div>

            {/* Debate Arena */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Conversation History */}
                <div className="lg:col-span-2 space-y-4">
                    {conversationHistory.map((entry, index) => (
                        <div
                            key={index}
                            className={`p-6 rounded-2xl border ${entry.type === 'prompt'
                                    ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/30'
                                    : entry.speaker === 'student'
                                        ? 'bg-blue-900/30 border-blue-500/30'
                                        : 'bg-purple-900/30 border-purple-500/30'
                                }`}
                        >
                            {entry.type === 'prompt' && (
                                <div>
                                    <div className="text-xs font-bold text-yellow-300 mb-2">📋 TASK 2 PROMPT</div>
                                    <div className="text-lg italic">{entry.text}</div>
                                </div>
                            )}

                            {entry.speaker === 'student' && (
                                <div>
                                    <div className="text-xs font-bold text-blue-300 mb-2">🎓 YOUR ARGUMENT</div>
                                    <div className="leading-relaxed">{entry.text}</div>
                                </div>
                            )}

                            {entry.speaker === 'ai' && (
                                <div>
                                    <div className="text-xs font-bold text-purple-300 mb-2">
                                        {selectedPhilosopher.emoji} {entry.philosopher.toUpperCase()} RESPONDS:
                                    </div>
                                    <div className="leading-relaxed italic">{entry.text}</div>
                                </div>
                            )}
                        </div>
                    ))}

                    {isAnalyzing && (
                        <div className="p-6 bg-slate-800/50 rounded-2xl border border-white/20 flex items-center justify-center gap-3">
                            <div className="w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <span>Analyzing your logic...</span>
                        </div>
                    )}
                </div>

                {/* Analysis Sidebar */}
                <div className="space-y-6">
                    {analysisResult && (
                        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                            <h3 className="font-bold mb-4 text-xl">📊 Logic Analysis</h3>

                            <div className="mb-4">
                                <div className="text-sm text-slate-400 mb-2">Complexity Score</div>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                            style={{ width: `${analysisResult.complexityScore * 10}%` }}
                                        />
                                    </div>
                                    <span className="font-bold">{analysisResult.complexityScore}/10</span>
                                </div>
                            </div>

                            {analysisResult.fallacies && analysisResult.fallacies.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-sm font-bold text-red-400 mb-2">⚠️ Fallacies Detected:</div>
                                    <ul className="space-y-2">
                                        {analysisResult.fallacies.map((fallacy, i) => (
                                            <li key={i} className="text-xs bg-red-900/30 border border-red-500/30 rounded-lg p-2">
                                                {fallacy}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysisResult.structures && analysisResult.structures.length > 0 && (
                                <div className="mb-4">
                                    <div className="text-sm font-bold text-green-400 mb-2">✅ Structures Used:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResult.structures.map((structure, i) => (
                                            <span key={i} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-bold capitalize">
                                                {structure}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {analysisResult.feedback && (
                                <div className="text-xs text-slate-400 italic border-l-2 border-purple-500 pl-3">
                                    {analysisResult.feedback}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Complex Structure Hints */}
                    <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                        <h3 className="font-bold mb-4">💡 Pro Tips</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="text-purple-300 font-bold">Concession:</div>
                                <div className="text-xs text-slate-400">"Although X, nevertheless Y..."</div>
                            </div>
                            <div>
                                <div className="text-pink-300 font-bold">Contrast:</div>
                                <div className="text-xs text-slate-400">"While X may be true, Y..."</div>
                            </div>
                            <div>
                                <div className="text-yellow-300 font-bold">Conditional:</div>
                                <div className="text-xs text-slate-400">"If X, then Y would..."</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Argument Input */}
            <div className="max-w-6xl mx-auto mt-6">
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <textarea
                        value={argument}
                        onChange={(e) => setArgument(e.target.value)}
                        placeholder="Type your argument here... Use complex sentence structures to earn higher scores!"
                        className="w-full h-32 bg-white/10 border border-white/20 rounded-lg p-4 text-white placeholder-slate-500 resize-none"
                        disabled={isAnalyzing}
                    />
                    <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-slate-400">
                            {argument.length} characters
                        </div>
                        <button
                            onClick={submitArgument}
                            disabled={!argument.trim() || isAnalyzing}
                            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? 'Analyzing...' : '⚔️ Submit Argument'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PhilosophersDuel;
