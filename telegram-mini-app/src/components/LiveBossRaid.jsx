import React, { useState, useEffect, useRef } from 'react';

export default function LiveBossRaid({ userId, eventId }) {
    const [event, setEvent] = useState(null);
    const [myContribution, setMyContribution] = useState(0);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const pollInterval = useRef(null);

    useEffect(() => {
        if (eventId) {
            fetchEventData();
            // Poll every 3 seconds for real-time updates
            pollInterval.current = setInterval(fetchEventData, 3000);
        }

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, [eventId]);

    async function fetchEventData() {
        try {
            const response = await fetch(`/api/events/${eventId}`);
            const data = await response.json();
            setEvent(data.event);
            setMyContribution(data.myContribution || 0);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch event data:', error);
        }
    }

    async function submitContribution() {
        if (!inputText.trim()) return;

        // Count complex sentences (contains subordinating conjunctions)
        const complexMarkers = ['although', 'because', 'since', 'while', 'whereas', 'if', 'unless', 'when', 'after', 'before'];
        const sentences = inputText.split(/[.!?]+/).filter(s => s.trim());
        const complexCount = sentences.filter(s =>
            complexMarkers.some(marker => s.toLowerCase().includes(marker))
        ).length;

        if (complexCount === 0) {
            alert('❌ No complex sentences detected! Use words like "although", "because", "while" to create complex structures.');
            return;
        }

        try {
            await fetch(`/api/events/${eventId}/contribute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    contribution: complexCount,
                    text: inputText
                })
            });

            setMyContribution(prev => prev + complexCount);
            setInputText('');
            fetchEventData(); // Refresh immediately

            // Show success feedback
            showSuccessAnimation(complexCount);
        } catch (error) {
            console.error('Failed to submit contribution:', error);
        }
    }

    function showSuccessAnimation(count) {
        const popup = document.createElement('div');
        popup.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-emerald-400 text-5xl font-bold z-50 pointer-events-none';
        popup.style.animation = 'damageUp 1.5s ease-out forwards';
        popup.innerHTML = `+${count} ⚔️`;
        document.body.appendChild(popup);
        setTimeout(() => popup.remove(), 1500);
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-emerald-400 text-xl animate-pulse">Loading Boss Raid...</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-red-400 text-xl">Event not found</div>
            </div>
        );
    }

    const progress = (event.current_progress / event.goal_target) * 100;
    const isActive = event.status === 'active';
    const isCompleted = event.status === 'completed';
    const isFailed = event.status === 'failed';

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Event Header */}
                <div className="text-center mb-8">
                    <div className="text-6xl md:text-8xl mb-4 animate-pulse-slow">👻</div>
                    <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-2">
                        {event.title}
                    </h1>
                    <p className="text-slate-400 text-sm md:text-base">{event.description}</p>
                </div>

                {/* Boss Card */}
                <div className="bg-gradient-to-br from-purple-900/50 to-slate-900 rounded-3xl p-6 md:p-8 border-2 border-purple-500 mb-8 shadow-2xl shadow-purple-500/30">
                    {/* Boss Name */}
                    <div className="text-center mb-6">
                        <h2 className="text-3xl md:text-4xl font-bold text-purple-300 mb-2">{event.boss_name}</h2>
                        <div className="text-sm text-slate-400">
                            {event.participant_count} scholars fighting
                        </div>
                    </div>

                    {/* HP Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-slate-300 mb-2">
                            <span>Boss HP</span>
                            <span>{event.current_progress.toLocaleString()} / {event.goal_target.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-8 bg-slate-800 rounded-full overflow-hidden border-2 border-purple-500">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 flex items-center justify-center"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            >
                                {progress > 10 && (
                                    <span className="text-white font-bold text-xs">{progress.toFixed(1)}%</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="text-center">
                        {isCompleted && (
                            <div className="text-emerald-400 text-2xl font-bold animate-bounce">
                                ✅ BOSS DEFEATED!
                            </div>
                        )}
                        {isFailed && (
                            <div className="text-red-400 text-2xl font-bold">
                                ❌ The Citadel has fallen...
                            </div>
                        )}
                        {isActive && (
                            <div className="text-yellow-400 text-xl font-bold animate-pulse">
                                🔴 BATTLE IN PROGRESS
                            </div>
                        )}
                        {event.status === 'upcoming' && (
                            <div className="text-cyan-400 text-xl font-bold">
                                ⏳ Starting soon...
                            </div>
                        )}
                    </div>
                </div>

                {/* My Contribution */}
                <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm text-slate-400">Your Contributions</div>
                            <div className="text-3xl font-bold text-emerald-400">{myContribution}</div>
                        </div>
                        <div className="text-5xl">⚔️</div>
                    </div>
                </div>

                {/* Contribution Form */}
                {isActive && (
                    <div className="bg-slate-900 rounded-3xl p-6 md:p-8 border-2 border-slate-700 mb-8">
                        <h3 className="text-xl font-bold text-white mb-4">Attack the Boss!</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Write sentences using complex structures (although, because, while, etc.)
                        </p>

                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Write complex sentences here... Example: Although technology is beneficial, it can be harmful if misused."
                            className="w-full h-32 bg-black text-white p-4 rounded-xl border-2 border-slate-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all resize-none mb-4 text-sm md:text-base"
                        />

                        <button
                            onClick={submitContribution}
                            disabled={!inputText.trim()}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                        >
                            ⚔️ Submit Attack
                        </button>

                        <div className="mt-4 text-xs text-slate-500 text-center">
                            Tip: Each complex sentence = 1 damage point
                        </div>
                    </div>
                )}

                {/* Reward */}
                {event.reward_description && (
                    <div className="bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border-2 border-yellow-500/50 rounded-2xl p-6 text-center">
                        <div className="text-4xl mb-2">🏆</div>
                        <h3 className="text-xl font-bold text-yellow-400 mb-2">Victory Reward</h3>
                        <p className="text-white">{event.reward_description}</p>
                    </div>
                )}

                {/* Event Timer */}
                {isActive && (
                    <div className="mt-8 text-center">
                        <div className="inline-block bg-red-900/30 border border-red-500/50 rounded-full px-6 py-3">
                            <span className="text-red-400 text-sm font-bold">
                                ⏰ Event ends: {new Date(event.scheduled_end).toLocaleString()}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes damageUp {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -150%) scale(1);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
