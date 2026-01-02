import React, { useState, useEffect, useRef } from 'react';

// Debounce helper function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Generate hash for caching
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}

const WRITING_PROMPTS = [
    {
        id: 1,
        text: 'Some people believe that technology makes us less social. Others think it helps us connect better. Discuss both views and give your own opinion.',
        difficulty: 'intermediate',
        band: 6.5
    },
    {
        id: 2,
        text: 'Education should be free for everyone. To what extent do you agree or disagree?',
        difficulty: 'beginner',
        band: 5.5
    },
    {
        id: 3,
        text: 'Globalization has both positive and negative effects on local cultures. Analyze this statement with specific examples.',
        difficulty: 'advanced',
        band: 7.5
    }
];

export default function WritingFoundry({ userId }) {
    const [selectedPrompt, setSelectedPrompt] = useState(WRITING_PROMPTS[0]);
    const [essayText, setEssayText] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [finalFeedback, setFinalFeedback] = useState(null);
    const textareaRef = useRef(null);
    const userIdRef = useRef(userId);

    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    // Debounced real-time analysis
    const analyzeText = useRef(
        debounce(async (text) => {
            if (text.length < 30) {
                setAnalysis(null);
                return;
            }

            setIsAnalyzing(true);
            try {
                const response = await fetch('/api/writing/analyze-realtime', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text,
                        userId: userIdRef.current,
                        textHash: simpleHash(text)
                    })
                });
                const data = await response.json();
                setAnalysis(data.analysis);
            } catch (error) {
                console.error('Analysis failed:', error);
            } finally {
                setIsAnalyzing(false);
            }
        }, 800)
    ).current;

    useEffect(() => {
        if (essayText) {
            analyzeText(essayText);
        } else {
            setAnalysis(null);
        }
    }, [essayText]);

    function applySuggestion(originalWord, replacement, power) {
        // Find and replace the word
        const regex = new RegExp(`\\b${originalWord}\\b`, 'i');
        const newText = essayText.replace(regex, replacement);
        setEssayText(newText);

        // Show power-up animation
        showPowerUpAnimation(replacement, power);
    }

    function showPowerUpAnimation(word, power) {
        const popup = document.createElement('div');
        popup.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-400 text-4xl font-bold z-50 pointer-events-none';
        popup.style.animation = 'powerUp 1.5s ease-out forwards';
        popup.innerHTML = `
      <div class="flex flex-col items-center">
        <div class="text-6xl mb-2">✨</div>
        <div>+${power} POWER</div>
        <div class="text-2xl text-white">${word}</div>
      </div>
    `;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1500);
    }

    async function submitEssay() {
        setSubmitted(true);
        try {
            const response = await fetch('/api/writing/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    essayText,
                    prompt: selectedPrompt.text,
                    wordCount: essayText.split(/\s+/).filter(w => w).length
                })
            });
            const result = await response.json();
            setFinalFeedback(result.feedback);
        } catch (error) {
            console.error('Submission failed:', error);
            setSubmitted(false);
        }
    }

    const wordCount = essayText.split(/\s+/).filter(w => w).length;
    const isMinimumMet = wordCount >= 250;

    if (submitted && finalFeedback) {
        return (
            <div className="min-h-screen bg-slate-950 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Grand Vizier Feedback */}
                    <div className="text-center mb-8">
                        <div className="text-8xl mb-4">🧙‍♂️</div>
                        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
                            Battle Report from the Grand Vizier
                        </h1>
                    </div>

                    {/* Band Score */}
                    <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500 rounded-3xl p-8 mb-8 text-center">
                        <div className="text-sm text-slate-400 mb-2">Your Linguistic Power Level</div>
                        <div className="text-7xl font-bold text-yellow-400 mb-2">
                            {finalFeedback.bandScore}
                        </div>
                        <div className="text-xl text-white">{finalFeedback.bandLabel}</div>
                    </div>

                    {/* Detailed Scores */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-slate-900 rounded-2xl p-4 text-center border border-slate-700">
                            <div className="text-xs text-slate-400 mb-2">Task Response</div>
                            <div className="text-3xl font-bold text-blue-400">{finalFeedback.taskResponse}</div>
                        </div>
                        <div className="bg-slate-900 rounded-2xl p-4 text-center border border-slate-700">
                            <div className="text-xs text-slate-400 mb-2">Cohesion</div>
                            <div className="text-3xl font-bold text-green-400">{finalFeedback.cohesion}</div>
                        </div>
                        <div className="bg-slate-900 rounded-2xl p-4 text-center border border-slate-700">
                            <div className="text-xs text-slate-400 mb-2">Lexical Resource</div>
                            <div className="text-3xl font-bold text-purple-400">{finalFeedback.lexical}</div>
                        </div>
                        <div className="bg-slate-900 rounded-2xl p-4 text-center border border-slate-700">
                            <div className="text-xs text-slate-400 mb-2">Grammar</div>
                            <div className="text-3xl font-bold text-orange-400">{finalFeedback.grammar}</div>
                        </div>
                    </div>

                    {/* Vizier's Message */}
                    <div className="bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-yellow-500/30 mb-8">
                        <h3 className="text-xl font-bold text-yellow-400 mb-4 uppercase tracking-wider">
                            ⚖️ The Grand Vizier's Verdict (Hukm):
                        </h3>
                        <p className="text-white leading-relaxed mb-6 text-lg">
                            {finalFeedback.message}
                        </p>

                        {finalFeedback.improvements && finalFeedback.improvements.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-300 mb-3">🎯 Forge Your Skills Further:</h4>
                                <ul className="space-y-2">
                                    {finalFeedback.improvements.map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                                            <span className="text-yellow-400">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* XP Earned */}
                    <div className="bg-gradient-to-r from-emerald-900/30 to-green-900/30 border-2 border-emerald-500 rounded-2xl p-6 text-center mb-8">
                        <div className="text-sm text-slate-300 mb-2">Experience Gained</div>
                        <div className="text-5xl font-bold text-emerald-400">+{finalFeedback.xpEarned} XP</div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={() => {
                                setSubmitted(false);
                                setFinalFeedback(null);
                                setEssayText('');
                                setAnalysis(null);
                            }}
                            className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
                        >
                            ✍️ Forge Another Essay
                        </button>
                        <button
                            onClick={() => window.location.hash = '#home'}
                            className="flex-1 py-4 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors"
                        >
                            🏠 Return to Arena
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                        The Writing Foundry
                    </h1>
                    <div className="text-orange-500 font-mono text-sm mb-2 tracking-widest">Yozuv Temirchiligi</div>
                    <p className="text-slate-400 text-sm md:text-base">
                        Here, sentences are spells. A complex sentence with subordination deals 3x the damage.
                    </p>
                </div>

                {/* Prompt Selection */}
                <div className="mb-6">
                    <label className="block text-slate-300 text-sm font-bold mb-3">Choose Your Challenge:</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {WRITING_PROMPTS.map(prompt => (
                            <button
                                key={prompt.id}
                                onClick={() => setSelectedPrompt(prompt)}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${selectedPrompt.id === prompt.id
                                    ? 'border-yellow-500 bg-yellow-900/20'
                                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                                    }`}
                            >
                                <div className="text-xs text-slate-400 mb-1">
                                    Band {prompt.band} · {prompt.difficulty}
                                </div>
                                <div className="text-sm text-white line-clamp-3">{prompt.text}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Editor */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-900 rounded-3xl p-6 md:p-8 border-2 border-slate-700">
                            {/* Selected Prompt Display */}
                            <div className="bg-black/50 rounded-2xl p-4 mb-6 border border-yellow-500/30">
                                <div className="text-xs text-yellow-400 font-bold mb-2">TASK 2 PROMPT:</div>
                                <div className="text-sm text-white leading-relaxed">{selectedPrompt.text}</div>
                            </div>

                            {/* Word Count */}
                            <div className="mb-4 flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Your Response</span>
                                <div className="flex items-center gap-4">
                                    <span className={`text-sm font-bold ${wordCount < 250 ? 'text-red-400' :
                                        wordCount > 350 ? 'text-yellow-400' :
                                            'text-green-400'
                                        }`}>
                                        {wordCount} / 250+ words
                                    </span>
                                    {wordCount < 250 && (
                                        <span className="text-xs text-red-400">
                                            ({250 - wordCount} more needed)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Text Area */}
                            <textarea
                                ref={textareaRef}
                                value={essayText}
                                onChange={(e) => setEssayText(e.target.value)}
                                className="w-full h-64 md:h-96 bg-black text-white p-4 md:p-6 rounded-2xl border-2 border-slate-600 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 transition-all resize-none text-sm md:text-base"
                                placeholder="Begin forging your argument... The Grand Vizier accepts no weakness. (Argumentingizni yozing...)"
                            />

                            {/* Submit Button */}
                            <button
                                onClick={submitEssay}
                                disabled={!isMinimumMet}
                                className="mt-4 w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                            >
                                {!isMinimumMet
                                    ? `Write ${250 - wordCount} more words to submit`
                                    : '🎯 Submit for Grand Vizier Review'}
                            </button>
                        </div>
                    </div>

                    {/* Real-Time Analysis Panel */}
                    <div className="space-y-4">
                        {/* Analyzing Indicator */}
                        {isAnalyzing && (
                            <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-2xl p-4 text-center">
                                <div className="animate-pulse text-blue-400 text-sm font-mono">
                                    👁️ THE VIZIER IS JUDGING YOUR LOGIC...
                                </div>
                            </div>
                        )}

                        {/* Cohesion Warnings */}
                        {analysis?.cohesionWarnings && analysis.cohesionWarnings.length > 0 && (
                            <div className="bg-red-900/30 border-2 border-red-500/50 rounded-2xl p-4 md:p-6">
                                <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2 text-sm md:text-base">
                                    <span>⚠️</span> Bridge Cracks Detected
                                </h3>
                                {analysis.cohesionWarnings.slice(0, 3).map((warning, i) => (
                                    <p key={i} className="text-xs md:text-sm text-red-300 mb-2">• {warning}</p>
                                ))}
                            </div>
                        )}

                        {/* Lexical Upgrades */}
                        {analysis?.lexicalUpgrades && analysis.lexicalUpgrades.length > 0 && (
                            <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-2xl p-4 md:p-6">
                                <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2 text-sm md:text-base">
                                    <span>✨</span> Power-Ups Available
                                </h3>
                                {analysis.lexicalUpgrades.slice(0, 3).map((upgrade, i) => (
                                    <div key={i} className="mb-4">
                                        <p className="text-xs md:text-sm text-slate-300 mb-2">
                                            Replace "<span className="text-red-400 font-bold">{upgrade.word}</span>" with:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {upgrade.suggestions.map((suggestion, j) => {
                                                const power = (j + 1) * 20;
                                                return (
                                                    <button
                                                        key={j}
                                                        onClick={() => applySuggestion(upgrade.word, suggestion, power)}
                                                        className="px-3 py-2 bg-yellow-600 text-white rounded-lg text-xs hover:bg-yellow-500 transition-colors flex items-center gap-1"
                                                    >
                                                        <span>{suggestion}</span>
                                                        <span className="text-yellow-200">(+{power})</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Grammar Suggestions */}
                        {analysis?.grammarSuggestions && analysis.grammarSuggestions.length > 0 && (
                            <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-2xl p-4 md:p-6">
                                <h3 className="text-purple-400 font-bold mb-3 flex items-center gap-2 text-sm md:text-base">
                                    <span>🛡️</span> Structural Enhancements
                                </h3>
                                {analysis.grammarSuggestions.slice(0, 2).map((suggestion, i) => (
                                    <p key={i} className="text-xs md:text-sm text-purple-200 mb-2">• {suggestion}</p>
                                ))}
                            </div>
                        )}

                        {/* Overall Assessment */}
                        {analysis?.overallTone && (
                            <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-2xl p-4 md:p-6">
                                <h3 className="text-blue-400 font-bold mb-2 text-sm md:text-base">Grand Vizier's Assessment</h3>
                                <p className="text-xs md:text-sm text-blue-200">{analysis.overallTone}</p>
                            </div>
                        )}

                        {/* Help Text */}
                        {!analysis && essayText.length < 30 && (
                            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 md:p-6">
                                <h3 className="text-slate-300 font-bold mb-2 text-sm">💡 Pro Tips:</h3>
                                <ul className="space-y-2 text-xs text-slate-400">
                                    <li>• Use transition words like "Furthermore", "However"</li>
                                    <li>• Avoid weak words like "good", "bad", "big"</li>
                                    <li>• Try complex sentences with subordination</li>
                                    <li>• Maintain academic tone throughout</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes powerUp {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -200%) scale(1);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
