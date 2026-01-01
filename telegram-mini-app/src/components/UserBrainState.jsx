import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';

export default function UserBrainState() {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const userId = WebApp.initDataUnsafe?.user?.id || 'demo_user';
            const response = await fetch(`/api/user/${userId}`);

            if (response.ok) {
                const data = await response.json();
                setUserData(data);
            } else {
                // Default data for new users
                setUserData({
                    username: WebApp.initDataUnsafe?.user?.username || 'Player',
                    speaking_band: 4.0,
                    listening_band: 0.0,
                    reading_band: 0.0,
                    writing_band: 0.0,
                    total_xp: 0
                });
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const skillDomains = [
        { name: 'Speaking', icon: '🎤', key: 'speaking_band', color: '#8b5cf6' },
        { name: 'Listening', icon: '👂', key: 'listening_band', color: '#3b82f6' },
        { name: 'Reading', icon: '📖', key: 'reading_band', color: '#10b981' },
        { name: 'Writing', icon: '✍️', key: 'writing_band', color: '#f59e0b' }
    ];

    const getBandColor = (band) => {
        if (band >= 8.5) return '#00ff00';
        if (band >= 7.5) return '#84cc16';
        if (band >= 6.5) return '#eab308';
        if (band >= 5.5) return '#f97316';
        if (band >= 4.5) return '#ef4444';
        return '#7f1d1d';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        🧠 Brain State
                    </h1>
                    <p className="text-zinc-400 mt-2">{userData?.username || 'Player'}</p>
                </motion.div>

                {/* Total XP */}
                <div className="bg-zinc-800 rounded-2xl p-6 mb-6 border border-zinc-700 text-center">
                    <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        {userData?.total_xp || 0}
                    </div>
                    <div className="text-zinc-400 mt-2">Total Linguistic XP</div>
                </div>

                {/* Skill Domains */}
                <div className="space-y-4">
                    {skillDomains.map((skill, index) => {
                        const bandValue = userData?.[skill.key] || 0;
                        const progress = (bandValue / 9.0) * 100;

                        return (
                            <motion.div
                                key={skill.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-zinc-800 rounded-xl p-6 border border-zinc-700"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-4xl">{skill.icon}</div>
                                        <div>
                                            <h3 className="font-bold text-lg">{skill.name}</h3>
                                            <p className="text-zinc-400 text-sm">Band {bandValue.toFixed(1)}</p>
                                        </div>
                                    </div>
                                    <div
                                        className="text-3xl font-bold"
                                        style={{ color: getBandColor(bandValue) }}
                                    >
                                        {bandValue.toFixed(1)}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-zinc-700 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                                        className="h-full rounded-full"
                                        style={{
                                            background: `linear-gradient(to right, ${skill.color}, ${getBandColor(bandValue)})`
                                        }}
                                    />
                                </div>

                                {/* Next Level */}
                                <div className="mt-3 text-sm text-zinc-400">
                                    {bandValue < 9.0 ? (
                                        <span>Next level: Band {(Math.floor(bandValue * 2) / 2 + 0.5).toFixed(1)}</span>
                                    ) : (
                                        <span className="text-green-400">✅ MAX LEVEL</span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Equipment Preview */}
                <div className="mt-8 bg-zinc-800 rounded-2xl p-6 border border-zinc-700">
                    <h3 className="font-bold text-xl mb-4 text-center">⚔️ Equipment</h3>
                    <p className="text-center text-zinc-400">
                        {userData?.speaking_band >= 4.5
                            ? '🔓 Basic Lexical Cape unlocked!'
                            : '🔒 Reach Band 4.5 to unlock equipment'}
                    </p>
                </div>
            </div>
        </div>
    );
}
