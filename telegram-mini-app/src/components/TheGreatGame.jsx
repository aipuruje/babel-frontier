import { useState, useEffect } from 'react';

const TheGreatGame = () => {
    const [selectedCity, setSelectedCity] = useState(null);
    const [activeBattle, setActiveBattle] = useState(null);
    const [territoryMap, setTerritoryMap] = useState([]);
    const [countdown, setCountdown] = useState(null);
    const [isContributing, setIsContributing] = useState(false);

    const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'demo_user';

    const cities = [
        { id: 'tashkent', name: 'Tashkent', emoji: '🏛️', color: '#3B82F6' },
        { id: 'samarkand', name: 'Samarkand', emoji: '🕌', color: '#8B5CF6' },
        { id: 'bukhara', name: 'Bukhara', emoji: '🏰', color: '#EC4899' },
        { id: 'khiva', name: 'Khiva', emoji: '⛩️', color: '#F59E0B' }
    ];

    useEffect(() => {
        loadLiveScores();
        loadTerritoryMap();
        const interval = setInterval(loadLiveScores, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, []);

    const loadLiveScores = async () => {
        try {
            const response = await fetch('/api/national/live-scores');
            const data = await response.json();
            setActiveBattle(data.battle);

            if (data.battle && data.battle.time_remaining) {
                setCountdown(data.battle.time_remaining);
            }
        } catch (error) {
            console.error('Load scores error:', error);
        }
    };

    const loadTerritoryMap = async () => {
        try {
            const response = await fetch('/api/national/territory-map');
            const data = await response.json();
            setTerritoryMap(data.territories);
        } catch (error) {
            console.error('Load map error:', error);
        }
    };

    const joinCity = async (city) => {
        try {
            const response = await fetch('/api/national/join-team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, cityName: city.name, regionName: city.name })
            });

            if (response.ok) {
                setSelectedCity(city);
            }
        } catch (error) {
            console.error('Join city error:', error);
        }
    };

    const contributeScore = async (contributionType, score) => {
        if (!selectedCity || !activeBattle) {
            alert('No active battle or city selected');
            return;
        }

        setIsContributing(true);

        try {
            const response = await fetch('/api/national/contribute-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    battleId: activeBattle.id,
                    contributionType,
                    score
                })
            });

            if (response.ok) {
                setTimeout(loadLiveScores, 500);
                alert(`+${score} points for ${selectedCity.name}! 🎉`);
            }
        } catch (error) {
            console.error('Contribute error:', error);
        } finally {
            setIsContributing(false);
        }
    };

    // Format countdown timer
    const formatCountdown = (seconds) => {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!selectedCity) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white p-6">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        🗺️ The Great Game
                    </h1>
                    <p className="text-slate-300 text-lg">
                        Choose your city. Fight for national glory.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cities.map(city => (
                        <div
                            key={city.id}
                            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20 hover:border-white/50 transition-all hover:scale-105 cursor-pointer"
                            style={{ borderColor: city.color + '40' }}
                            onClick={() => joinCity(city)}
                        >
                            <div className="text-center">
                                <div className="text-7xl mb-4">{city.emoji}</div>
                                <h3 className="text-3xl font-bold mb-2">{city.name}</h3>
                                <button
                                    className="mt-4 w-full px-8 py-4 font-bold rounded-xl text-white transition-all"
                                    style={{ background: city.color }}
                                >
                                    Join {city.name}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tournament Info */}
                <div className="max-w-3xl mx-auto mt-16 bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <h3 className="font-bold text-white mb-4 text-xl">⚔️ Silk Road Tournament:</h3>
                    <ul className="space-y-2 list-disc list-inside text-slate-300">
                        <li>Battles scheduled every evening at <strong className="text-yellow-400">19:00</strong></li>
                        <li>Contribute your Speaking/Writing scores to help your city win</li>
                        <li>Winning city captures territory on the national map</li>
                        <li>Rewards: <strong>Tax-Free Energy Day</strong> for all team members</li>
                        <li>Top individual contributor receives <strong className="text-purple-400">direct UK university meeting</strong></li>
                    </ul>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-5xl">{selectedCity.emoji}</span>
                        <div>
                            <h2 className="text-3xl font-bold">{selectedCity.name}</h2>
                            <p className="text-sm text-slate-400">Fighting for national glory</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSelectedCity(null)}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg transition-all"
                    >
                        Change City
                    </button>
                </div>
            </div>

            {/* Battle Status */}
            {activeBattle ? (
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="bg-gradient-to-r from-red-900/30 to-orange-900/30 backdrop-blur-lg rounded-2xl p-8 border-2 border-red-500/50">
                        <div className="text-center mb-6">
                            <div className="text-red-400 font-bold text-sm mb-2">🔥 ACTIVE BATTLE</div>
                            <h3 className="text-3xl font-bold">{activeBattle.name}</h3>
                            {countdown !== null && (
                                <div className="mt-4 text-6xl font-mono font-bold text-yellow-400">
                                    {formatCountdown(countdown)}
                                </div>
                            )}
                        </div>

                        {/* Live Scoreboard */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className={`text-center p-6 rounded-xl ${selectedCity.name === activeBattle.city_a ? 'bg-blue-500/30 border-2 border-blue-500' : 'bg-white/10'}`}>
                                <div className="text-4xl mb-2">
                                    {cities.find(c => c.name.toLowerCase() === activeBattle.city_a.toLowerCase())?.emoji || '🏛️'}
                                </div>
                                <div className="text-2xl font-bold">{activeBattle.city_a}</div>
                                <div className="text-5xl font-bold mt-4 text-blue-400">{activeBattle.city_a_score}</div>
                            </div>

                            <div className={`text-center p-6 rounded-xl ${selectedCity.name === activeBattle.city_b ? 'bg-purple-500/30 border-2 border-purple-500' : 'bg-white/10'}`}>
                                <div className="text-4xl mb-2">
                                    {cities.find(c => c.name.toLowerCase() === activeBattle.city_b.toLowerCase())?.emoji || '🕌'}
                                </div>
                                <div className="text-2xl font-bold">{activeBattle.city_b}</div>
                                <div className="text-5xl font-bold mt-4 text-purple-400">{activeBattle.city_b_score}</div>
                            </div>
                        </div>

                        {/* Contribute Actions */}
                        <div className="mt-8 grid grid-cols-3 gap-4">
                            <button
                                onClick={() => contributeScore('speaking', 50 + Math.floor(Math.random() * 50))}
                                disabled={isContributing}
                                className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                🎤 Speaking Battle
                            </button>
                            <button
                                onClick={() => contributeScore('writing', 60 + Math.floor(Math.random() * 40))}
                                disabled={isContributing}
                                className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                ✍️ Writing Shield
                            </button>
                            <button
                                onClick={() => contributeScore('reading', 40 + Math.floor(Math.random() * 60))}
                                disabled={isContributing}
                                className="px-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 font-bold rounded-xl transition-all disabled:opacity-50"
                            >
                                📖 Reading Chain
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto mb-8 text-center p-12 bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-white/10">
                    <div className="text-6xl mb-4">⏰</div>
                    <h3 className="text-2xl font-bold mb-2">No Active Battle</h3>
                    <p className="text-slate-400">Next battle scheduled for 19:00 local time</p>
                </div>
            )}

            {/* Territory Map */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span>🗺️</span> National Territory Control
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {territoryMap.map(territory => {
                            const controllingCity = cities.find(c => c.name === territory.controlling_city);
                            return (
                                <div
                                    key={territory.id}
                                    className="p-4 rounded-xl border-2 transition-all"
                                    style={{
                                        backgroundColor: controllingCity ? controllingCity.color + '20' : '#1F2937',
                                        borderColor: controllingCity ? controllingCity.color : '#374151'
                                    }}
                                >
                                    <div className="text-sm font-bold mb-1">{territory.region_name}</div>
                                    {territory.controlling_city ? (
                                        <div className="flex items-center gap-2 text-xs">
                                            <span>{controllingCity?.emoji}</span>
                                            <span className="text-slate-300">{territory.controlling_city}</span>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-500">Unclaimed</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TheGreatGame;
