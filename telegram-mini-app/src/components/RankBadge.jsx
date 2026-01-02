import { motion } from 'framer-motion';

const RANK_BADGES = {
    'band_9.0': { title: 'The Sultan of Syntax', emoji: '👑', color: '#00ff00', tier: 'diamond' },
    'band_8.5': { title: 'The Grand Vizier', emoji: '⭐', color: '#10b981', tier: 'diamond' },
    'band_8.0': { title: 'The Royal Scribe', emoji: '🌟', color: '#22c55e', tier: 'gold' },
    'band_7.5': { title: 'The Master Merchant', emoji: '✨', color: '#84cc16', tier: 'gold' },
    'band_7.0': { title: 'The Silk Trader', emoji: '💫', color: '#eab308', tier: 'silver' },
    'band_6.5': { title: 'The Bazaar Keeper', emoji: '🔥', color: '#f59e0b', tier: 'silver' },
    'band_6.0': { title: 'The Caravan Guide', emoji: '⚡', color: '#f97316', tier: 'bronze' },
    'band_5.5': { title: 'The Desert Wanderer', emoji: '⚠️', color: '#ef4444', tier: 'bronze' },
    'band_5.0': { title: 'The Nomadic Seeker', emoji: '🔻', color: '#dc2626', tier: 'iron' },
    'band_4.5': { title: 'The Dusty Traveler', emoji: '❌', color: '#b91c1c', tier: 'iron' },
    'band_4.0': { title: 'The Lost Pilgrim', emoji: '💀', color: '#991b1b', tier: 'broken' },
    'band_3.5': { title: 'The Outcast', emoji: '☠️', color: '#7f1d1d', tier: 'broken' }
};

export default function RankBadge({ bandScore, size = 'medium', showTitle = true, animated = true }) {
    const badge = RANK_BADGES[bandScore] || RANK_BADGES['band_3.5'];

    const sizes = {
        small: { container: 'w-12 h-12', emoji: 'text-2xl', title: 'text-xs' },
        medium: { container: 'w-16 h-16', emoji: 'text-3xl', title: 'text-sm' },
        large: { container: 'w-24 h-24', emoji: 'text-5xl', title: 'text-base' }
    };

    const currentSize = sizes[size];

    const tierStyles = {
        diamond: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 shadow-lg shadow-cyan-500/50',
        gold: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-lg shadow-yellow-500/50',
        silver: 'bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 shadow-lg shadow-gray-400/50',
        bronze: 'bg-gradient-to-br from-amber-700 via-amber-800 to-orange-900 shadow-lg shadow-orange-700/50',
        iron: 'bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-800 shadow-lg shadow-zinc-600/50',
        broken: 'bg-gradient-to-br from-red-900 via-red-950 to-black shadow-lg shadow-red-900/50'
    };

    const BadgeContent = () => (
        <>
            <div
                className={`${currentSize.container} ${tierStyles[badge.tier]} rounded-full flex items-center justify-center border-4 border-black relative overflow-hidden`}
                style={{
                    boxShadow: `0 0 30px ${badge.color}50`
                }}
            >
                {/* Rotating background effect for diamond/gold tiers */}
                {(badge.tier === 'diamond' || badge.tier === 'gold') && animated && (
                    <motion.div
                        className="absolute inset-0 opacity-30"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        style={{
                            background: `conic-gradient(from 0deg, transparent, ${badge.color}, transparent)`
                        }}
                    />
                )}

                {/* Emoji */}
                <span className={`${currentSize.emoji} relative z-10 drop-shadow-lg`}>
                    {badge.emoji}
                </span>

                {/* Rank glow pulse */}
                {animated && (
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                            boxShadow: [
                                `0 0 10px ${badge.color}80`,
                                `0 0 25px ${badge.color}CC`,
                                `0 0 10px ${badge.color}80`
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </div>

            {showTitle && (
                <div className="text-center mt-2">
                    <p
                        className={`${currentSize.title} font-bold uppercase tracking-wider`}
                        style={{ color: badge.color }}
                    >
                        {badge.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        Band {bandScore.replace('band_', '')}
                    </p>
                </div>
            )}
        </>
    );

    if (animated) {
        return (
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <BadgeContent />
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            <BadgeContent />
        </div>
    );
}
