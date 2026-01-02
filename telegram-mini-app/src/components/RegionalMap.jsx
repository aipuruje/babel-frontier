import React, { useState, useEffect } from 'react';

const UZBEK_REGIONS = [
    { id: 'chilanzar', name: 'Chilanzar', nameUz: 'Чиланзар', city: 'Tashkent' },
    { id: 'yunusabad', name: 'Yunusabad', nameUz: 'Юнусобод', city: 'Tashkent' },
    { id: 'mirzo_ulugbek', name: 'Mirzo Ulugbek', nameUz: 'Мирзо Улуғбек', city: 'Tashkent' },
    { id: 'sergeli', name: 'Sergeli', nameUz: 'Сергели', city: 'Tashkent' },
    { id: 'samarkand', name: 'Samarkand', nameUz: 'Самарқанд', city: 'Samarkand' },
    { id: 'bukhara', name: 'Bukhara', nameUz: 'Бухоро', city: 'Bukhara' },
    { id: 'fergana', name: 'Fergana', nameUz: 'Фарғона', city: 'Fergana' },
    { id: 'andijan', name: 'Andijan', nameUz: 'Андижон', city: 'Andijan' },
    { id: 'namangan', name: 'Namangan', nameUz: 'Наманган', city: 'Namangan' },
    { id: 'nukus', name: 'Nukus', nameUz: 'Нукус', city: 'Nukus' }
];

export default function RegionalMap({ userId }) {
    const [regionalData, setRegionalData] = useState([]);
    const [userRegion, setUserRegion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLocationPicker, setShowLocationPicker] = useState(false);

    useEffect(() => {
        fetchRegionalData();
    }, [userId]);

    async function fetchRegionalData() {
        try {
            const response = await fetch('/api/regions/map');
            const data = await response.json();
            setRegionalData(data.regions || []);
            setUserRegion(data.userRegion);

            // Show location picker if user hasn't selected region
            if (!data.userRegion) {
                setShowLocationPicker(true);
            }
        } catch (error) {
            console.error('Failed to fetch regional data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function selectRegion(regionId) {
        try {
            await fetch('/api/user/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, region: regionId })
            });
            setUserRegion(regionId);
            setShowLocationPicker(false);
            fetchRegionalData(); // Refresh data
        } catch (error) {
            console.error('Failed to set location:', error);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-emerald-400 text-xl animate-pulse">Loading Neo-Uzbekistan...</div>
            </div>
        );
    }

    // Find top 3 regions
    const topRegions = [...regionalData]
        .sort((a, b) => b.average_band_score - a.average_band_score)
        .slice(0, 3);

    const getRegionGlow = (region) => {
        const rank = topRegions.findIndex(r => r.region === region.region) + 1;
        if (rank === 1) return 'from-yellow-400 to-amber-600'; // Gold
        if (rank === 2) return 'from-gray-300 to-gray-500'; // Silver
        if (rank === 3) return 'from-orange-600 to-orange-800'; // Bronze
        return 'from-slate-700 to-slate-900';
    };

    const userRegionData = regionalData.find(r => r.region === userRegion);

    if (showLocationPicker) {
        return (
            <div className="min-h-screen bg-slate-950 p-4 md:p-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-4xl font-bold text-white mb-4">Select Your Region</h1>
                    <p className="text-slate-400 mb-8">Choose your district to compete with local scholars!</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {UZBEK_REGIONS.map(region => (
                            <button
                                key={region.id}
                                onClick={() => selectRegion(region.id)}
                                className="p-6 bg-slate-800 hover:bg-slate-700 rounded-2xl border-2 border-slate-600 hover:border-emerald-500 transition-all text-left"
                            >
                                <div className="text-xl font-bold text-white mb-1">{region.name}</div>
                                <div className="text-sm text-slate-400">{region.nameUz}</div>
                                <div className="text-xs text-emerald-400 mt-2">{region.city}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                            Neo-Uzbekistan
                        </h1>
                        <p className="text-slate-400">Regional Linguistic Dominance Map</p>
                    </div>
                    <button
                        onClick={() => setShowLocationPicker(true)}
                        className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition"
                    >
                        📍 Change Region
                    </button>
                </div>
            </div>

            {/* Top 3 Podium */}
            {topRegions.length >= 3 && (
                <div className="max-w-6xl mx-auto mb-12">
                    <div className="grid grid-cols-3 gap-4 items-end">
                        {/* 2nd Place */}
                        <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-2xl p-4 md:p-6 h-32 flex flex-col justify-end">
                            <div className="text-4xl md:text-6xl mb-2">🥈</div>
                            <div className="text-white font-bold text-sm md:text-base truncate">{topRegions[1].region}</div>
                            <div className="text-gray-200 text-xs md:text-sm">Band {topRegions[1].average_band_score.toFixed(1)}</div>
                        </div>

                        {/* 1st Place */}
                        <div className="bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl p-4 md:p-6 h-48 flex flex-col justify-end animate-pulse-slow shadow-2xl shadow-yellow-500/50">
                            <div className="text-6xl md:text-8xl mb-2">👑</div>
                            <div className="text-black font-bold text-base md:text-xl truncate">{topRegions[0].region}</div>
                            <div className="text-gray-900 text-xs md:text-sm">Band {topRegions[0].average_band_score.toFixed(1)}</div>
                            <div className="text-[10px] md:text-xs text-gray-800 mt-1">{topRegions[0].total_users} scholars</div>
                        </div>

                        {/* 3rd Place */}
                        <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-4 md:p-6 h-24 flex flex-col justify-end">
                            <div className="text-3xl md:text-4xl mb-2">🥉</div>
                            <div className="text-white font-bold text-xs md:text-sm truncate">{topRegions[2].region}</div>
                            <div className="text-orange-200 text-[10px] md:text-xs">Band {topRegions[2].average_band_score.toFixed(1)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Regional Cards */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {regionalData.map(region => {
                    const isUserRegion = userRegion === region.region;
                    const rank = topRegions.findIndex(r => r.region === region.region) + 1;

                    return (
                        <div
                            key={region.region}
                            className={`relative rounded-2xl p-6 border-2 ${isUserRegion ? 'border-cyan-500 scale-105' : 'border-slate-700'
                                } bg-gradient-to-br ${getRegionGlow(region)} transition-transform`}
                        >
                            {isUserRegion && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-cyan-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                                    YOUR REGION
                                </div>
                            )}

                            <div className="text-center">
                                <div className="text-xl md:text-2xl font-bold text-white mb-2 truncate">{region.region}</div>

                                {/* Band Score */}
                                <div className="mb-4">
                                    <div className="text-3xl md:text-4xl font-bold text-white">
                                        {region.average_band_score.toFixed(1)}
                                    </div>
                                    <div className="text-xs text-gray-200">Average Band</div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-black/30 rounded-lg p-2">
                                        <div className="text-base md:text-lg font-bold text-white">{region.total_users}</div>
                                        <div className="text-[10px] text-gray-300">Scholars</div>
                                    </div>
                                    <div className="bg-black/30 rounded-lg p-2">
                                        <div className="text-base md:text-lg font-bold text-emerald-400">{(region.total_xp / 1000).toFixed(1)}K</div>
                                        <div className="text-[10px] text-gray-300">Total XP</div>
                                    </div>
                                </div>

                                {/* Ranking */}
                                {rank <= 3 && (
                                    <div className="text-xs text-white font-bold">
                                        #{rank} in Uzbekistan
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Rally Call */}
            {userRegionData && topRegions[0] && userRegion !== topRegions[0].region && (
                <div className="max-w-4xl mx-auto bg-red-900/30 border-2 border-red-500 rounded-2xl p-6 animate-pulse">
                    <h3 className="text-xl md:text-2xl font-bold text-red-400 mb-2">⚔️ Rally Call!</h3>
                    <p className="text-white text-base md:text-lg mb-4">
                        {userRegion} is losing to {topRegions[0].region}!
                        Complete 5 missions now to reclaim the throne!
                    </p>
                    <button
                        onClick={() => window.location.hash = '#battle'}
                        className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition"
                    >
                        Accept the Challenge
                    </button>
                </div>
            )}

            {/* Your Region Stats */}
            {userRegionData && (
                <div className="max-w-4xl mx-auto mt-8 bg-slate-800/50 rounded-2xl p-6 border border-cyan-500/30">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4">Your Region: {userRegion}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white">{userRegionData.total_users}</div>
                            <div className="text-xs text-slate-400">Active Scholars</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-400">{userRegionData.average_band_score.toFixed(1)}</div>
                            <div className="text-xs text-slate-400">Avg Band Score</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-400">{userRegionData.total_xp.toLocaleString()}</div>
                            <div className="text-xs text-slate-400">Collective XP</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-400">
                                {topRegions.findIndex(r => r.region === userRegion) + 1 || '—'}
                            </div>
                            <div className="text-xs text-slate-400">National Rank</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
