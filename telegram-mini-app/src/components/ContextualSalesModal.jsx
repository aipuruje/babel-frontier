import React from 'react';

export default function ContextualSalesModal({
    isOpen,
    onClose,
    onPurchase,
    userContext = {}
}) {
    if (!isOpen) return null;

    const { winStreak = 0, currentEnergy = 0, lastActivity = 'battle' } = userContext;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-3xl p-6 md:p-8 max-w-md w-full border-2 border-emerald-500 shadow-2xl shadow-emerald-500/50 relative">
                {/* Pulsing glow effect */}
                <div className="absolute inset-0 bg-emerald-500/10 rounded-3xl animate-pulse"></div>

                <div className="relative z-10">
                    {/* Grand Vizier Character */}
                    <div className="text-7xl md:text-8xl text-center mb-4 animate-bounce-slow">
                        🧙‍♂️
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl md:text-3xl font-bold text-emerald-400 text-center mb-4">
                        The Grand Vizier Speaks
                    </h2>

                    {/* Dynamic Message */}
                    <div className="bg-black/40 rounded-2xl p-4 mb-6 border border-emerald-500/30">
                        <p className="text-white text-base md:text-lg leading-relaxed text-center">
                            {winStreak >= 3 ? (
                                <>
                                    "Your momentum is <span className="text-yellow-400 font-bold">legendary</span>, young scholar!
                                    You've conquered <span className="text-emerald-400 font-bold">{winStreak} battles</span> in a row.
                                    <span className="block mt-2 text-red-400 font-bold">But your energy has run dry...</span>
                                    Don't let the fire die out now!"
                                </>
                            ) : (
                                <>
                                    "The path to mastery requires <span className="text-emerald-400 font-bold">sustained effort</span>.
                                    <span className="block mt-2 text-yellow-400">Your energy reserves are depleted.</span>
                                    Replenish to continue your journey!"
                                </>
                            )}
                        </p>
                    </div>

                    {/* Energy Status */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className="text-2xl">⚡</div>
                        <div className="text-slate-300">Current Energy:</div>
                        <div className="text-3xl font-bold text-red-400">{currentEnergy}</div>
                    </div>

                    {/* Product Offer */}
                    <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 rounded-2xl p-6 mb-6 border border-emerald-500/50">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="text-4xl">🍜</div>
                                <div>
                                    <div className="text-white font-bold">Plov Potion Bundle</div>
                                    <div className="text-xs text-slate-400">5 Energy Potions</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-yellow-400">5,000</div>
                                <div className="text-xs text-slate-400">UZS</div>
                            </div>
                        </div>

                        <div className="bg-black/50 rounded-xl p-3 mb-4">
                            <div className="text-xs text-slate-400 mb-2">You will receive:</div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-green-400">✓</span>
                                <span className="text-white">5 Speaking Battles</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-green-400">✓</span>
                                <span className="text-white">Continue your {winStreak}-win streak</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-green-400">✓</span>
                                <span className="text-white">Instant activation</span>
                            </div>
                        </div>

                        {/* Purchase Button */}
                        <button
                            onClick={onPurchase}
                            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-emerald-500/30 text-sm md:text-base"
                        >
                            🔥 Ignite the Flame - Buy with Click/Payme
                        </button>
                    </div>

                    {/* Alternative Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={() => {
                                // Navigate to marketplace
                                onClose();
                                window.location.hash = '#marketplace';
                            }}
                            className="w-full py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm"
                        >
                            Browse Other Products
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 text-slate-400 hover:text-white transition-colors text-sm"
                        >
                            Not now (lose momentum ❌)
                        </button>
                    </div>

                    {/* Urgency Timer (if win streak is high) */}
                    {winStreak >= 5 && (
                        <div className="mt-4 text-center">
                            <div className="inline-block bg-red-900/30 border border-red-500/50 rounded-full px-4 py-2">
                                <span className="text-red-400 text-xs font-bold animate-pulse">
                                    ⚠️ Your {winStreak}-win streak expires in 10 minutes!
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
