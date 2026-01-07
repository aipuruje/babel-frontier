import { useState, useEffect } from 'react';

/**
 * Active Memory HUD
 * Displays "Charged Spells" (buffered phrases from reading/listening) that user must deploy
 */
export default function ActiveMemoryHUD({ userId, onPhraseClick }) {
    const [chargedSpells, setChargedSpells] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchActiveBuffer = async () => {
            try {
                const response = await fetch(`/api/golden-thread/active-buffer/${userId}`);
                const data = await response.json();
                setChargedSpells(data.charged_spells || []);
            } catch (error) {
                console.error('Failed to fetch active buffer:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveBuffer();

        // Refresh every 30 seconds to update timers
        const interval = setInterval(fetchActiveBuffer, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    const formatTimeRemaining = (secondsRemaining) => {
        if (secondsRemaining < 0) return 'EXPIRED';

        const hours = Math.floor(secondsRemaining / 3600);
        const minutes = Math.floor((secondsRemaining % 3600) / 60);
        const seconds = secondsRemaining % 60;

        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const getBandColor = (bandValue) => {
        if (bandValue >= 8) return '#ffd700'; // Gold
        if (bandValue >= 7) return '#c0c0c0'; // Silver
        if (bandValue >= 6) return '#cd7f32'; // Bronze
        return '#888888'; // Gray
    };

    if (loading) return null;
    if (chargedSpells.length === 0) return null;

    return (
        <div className="fixed top-20 right-4 z-50 space-y-2 min-w-[280px]">
            <div className="text-center text-xs uppercase tracking-wider text-gray-400 mb-2">
                ⚡ Charged Spells
            </div>

            {chargedSpells.map((spell) => {
                const secondsRemaining = spell.seconds_remaining || 0;
                const isExpiring = secondsRemaining < 1800; // Less than 30 min
                const isExpired = secondsRemaining < 0;

                return (
                    <div
                        key={spell.id}
                        onClick={() => !isExpired && onPhraseClick && onPhraseClick(spell)}
                        className={`
                            relative p-3 rounded-lg backdrop-blur-sm cursor-pointer
                            transition-all duration-300 hover:scale-105
                            ${isExpired
                                ? 'bg-gray-800/50 opacity-50'
                                : 'bg-gradient-to-r from-purple-900/80 to-blue-900/80 shadow-lg shadow-purple-500/20'
                            }
                            ${isExpiring && !isExpired ? 'animate-pulse' : ''}
                        `}
                    >
                        {/* Glow effect for high-value phrases */}
                        {spell.band_value >= 7 && !isExpired && (
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-purple-400/10 rounded-lg blur-sm"></div>
                        )}

                        <div className="relative z-10">
                            {/* Band value indicator */}
                            <div className="flex items-center justify-between mb-2">
                                <span
                                    className="text-xs font-bold px-2 py-0.5 rounded"
                                    style={{
                                        backgroundColor: getBandColor(spell.band_value) + '33',
                                        color: getBandColor(spell.band_value)
                                    }}
                                >
                                    BAND {spell.band_value.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-400 uppercase">
                                    {spell.phrase_type}
                                </span>
                            </div>

                            {/* The phrase */}
                            <div className="text-sm font-medium text-white mb-2">
                                "{spell.target_phrase}"
                            </div>

                            {/* Timer */}
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">
                                    {spell.source_content_title?.substring(0, 20)}...
                                </span>
                                <span className={`
                                    font-mono font-bold
                                    ${isExpired ? 'text-red-500' : isExpiring ? 'text-yellow-400' : 'text-green-400'}
                                `}>
                                    ⏱️ {formatTimeRemaining(secondsRemaining)}
                                </span>
                            </div>

                            {/* Click hint */}
                            {!isExpired && (
                                <div className="mt-2 text-xs text-center text-gray-500">
                                    Click to see original context
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Instructions footer */}
            <div className="text-center text-xs text-gray-500 mt-3 p-2 bg-gray-900/50 rounded-lg">
                Use these phrases in your next mission to deal <span className="text-yellow-400 font-bold">CRITICAL DAMAGE</span>! 💥
            </div>
        </div>
    );
}
