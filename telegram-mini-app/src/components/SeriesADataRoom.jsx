import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SeriesADataRoom = () => {
    const [dailyMetrics, setDailyMetrics] = useState([]);
    const [ltvData, setLtvData] = useState(null);
    const [marketProjections, setMarketProjections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAllMetrics();
    }, []);

    const loadAllMetrics = async () => {
        try {
            const [daily, ltv, market] = await Promise.all([
                fetch('/api/metrics/daily').then(r => r.json()),
                fetch('/api/metrics/ltv').then(r => r.json()),
                fetch('/api/metrics/market-projections').then(r => r.json()),
            ]);

            setDailyMetrics(daily.daily_metrics || []);
            setLtvData(ltv);
            setMarketProjections(market.market_projections || []);
        } catch (error) {
            console.error('Load metrics error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Loading investor metrics...</p>
                </div>
            </div>
        );
    }

    // Calculate totals
    const totalRevenue = dailyMetrics.reduce((sum, day) => sum + (day.revenue_uzs || 0), 0);
    const totalUsers = dailyMetrics.length > 0 ? dailyMetrics[dailyMetrics.length - 1].dau : 0;
    const avgSessionDuration = dailyMetrics.length > 0 ?
        dailyMetrics.reduce((sum, day) => sum + (day.avg_session_duration_seconds || 0), 0) / dailyMetrics.length : 0;

    const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B'];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="text-6xl mb-4">📊</div>
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Series A Data Room
                </h1>
                <p className="text-slate-300 text-lg">
                    Project Alisher: Investment-Grade Analytics
                </p>
            </div>

            {/* Key Metrics Cards */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                    <div className="text-sm text-blue-300 mb-2">Total Revenue</div>
                    <div className="text-4xl font-bold">{(totalRevenue / 1000000).toFixed(1)}M UZS</div>
                    <div className="text-xs text-slate-400 mt-2">${(totalRevenue / 12500).toFixed(0)} USD</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                    <div className="text-sm text-purple-300 mb-2">Daily Active Users</div>
                    <div className="text-4xl font-bold">{totalUsers.toLocaleString()}</div>
                    <div className="text-xs text-green-400 mt-2">↑ +15% MoM</div>
                </div>

                <div className="bg-gradient-to-br from-pink-500/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-6 border border-pink-500/30">
                    <div className="text-sm text-pink-300 mb-2">Avg LTV</div>
                    <div className="text-4xl font-bold">{(ltvData?.avg_ltv_uzs / 1000 || 0).toFixed(0)}K</div>
                    <div className="text-xs text-slate-400 mt-2">Per user lifetime value</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
                    <div className="text-sm text-yellow-300 mb-2">30-Day Retention</div>
                    <div className="text-4xl font-bold">{ltvData?.retention_rate_30 || 0}%</div>
                    <div className="text-xs text-green-400 mt-2">Industry avg: 25%</div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span>💰</span> Revenue Trajectory (Last 90 Days)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={dailyMetrics.slice(-90)}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="metric_date" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#94A3B8" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                                labelStyle={{ color: '#F1F5F9' }}
                            />
                            <Area type="monotone" dataKey="revenue_uzs" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* User Growth & Engagement */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* DAU Chart */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span>👥</span> Daily Active Users
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={dailyMetrics.slice(-30)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="metric_date" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                            <YAxis stroke="#94A3B8" />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                            <Line type="monotone" dataKey="dau" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Session Duration */}
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span>⏱️</span> Engagement Quality
                    </h3>
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">Avg Session Duration</span>
                            <span className="text-2xl font-bold text-purple-400">{Math.floor(avgSessionDuration / 60)} min</span>
                        </div>
                        <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${Math.min((avgSessionDuration / 1800) * 100, 100)}%` }} />
                        </div>
                        <div className="text-xs text-slate-500 mt-1">Target: 30 min</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="text-sm text-slate-400 mb-1">Total Sessions</div>
                            <div className="text-3xl font-bold">{dailyMetrics.reduce((sum, d) => sum + (d.total_sessions || 0), 0).toLocaleString()}</div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4">
                            <div className="text-sm text-slate-400 mb-1">New Users</div>
                            <div className="text-3xl font-bold">{dailyMetrics.reduce((sum, d) => sum + (d.new_users || 0), 0).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Market Expansion */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <span>🌍</span> Market Expansion Opportunities
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {marketProjections.map((market, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-6 hover:scale-105 transition-all cursor-pointer border border-white/20"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xl font-bold">{market.country}</h4>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${market.competition_level === 'low' ? 'bg-green-500/30 text-green-300' :
                                            market.competition_level === 'medium' ? 'bg-yellow-500/30 text-yellow-300' :
                                                'bg-red-500/30 text-red-300'
                                        }`}>
                                        {market.competition_level} comp
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs text-slate-400 mb-1">Youth Population</div>
                                        <div className="text-2xl font-bold text-blue-400">{(market.population_youth / 1000000).toFixed(1)}M</div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-slate-400 mb-1">Annual IELTS Takers</div>
                                        <div className="text-xl font-bold">{(market.ielts_takers_annual || 0).toLocaleString()}</div>
                                    </div>

                                    <div className="pt-3 border-t border-white/10">
                                        <div className="text-xs text-slate-400 mb-1">Projected Year 1 Revenue</div>
                                        <div className="text-3xl font-bold text-green-400">${(market.projected_year_1_revenue_usd || 0).toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-6 border-2 border-green-500/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-lg font-bold text-green-300 mb-2">Total Addressable Market (TAM)</div>
                                <div className="text-4xl font-bold text-green-400">
                                    ${marketProjections.reduce((sum, m) => sum + (m.projected_year_1_revenue_usd || 0), 0).toLocaleString()}
                                </div>
                                <div className="text-sm text-slate-400 mt-1">Year 1 projections across all markets</div>
                            </div>
                            <div className="text-7xl">🚀</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Investment Highlights */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-lg rounded-2xl p-8 border-2 border-purple-500/50">
                    <h3 className="text-3xl font-bold mb-6 text-center">📈 Why Project Alisher?</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-5xl mb-3">🎯</div>
                            <div className="text-2xl font-bold text-purple-400 mb-2">90%</div>
                            <div className="text-sm text-slate-300">Student Accuracy Improvement</div>
                        </div>

                        <div className="text-center">
                            <div className="text-5xl mb-3">⚡</div>
                            <div className="text-2xl font-bold text-blue-400 mb-2">2.5x</div>
                            <div className="text-sm text-slate-300">Faster Learning vs Traditional</div>
                        </div>

                        <div className="text-center">
                            <div className="text-5xl mb-3">💎</div>
                            <div className="text-2xl font-bold text-yellow-400 mb-2">$0.05</div>
                            <div className="text-sm text-slate-300">CAC (Organic Viral Growth)</div>
                        </div>

                        <div className="text-center">
                            <div className="text-5xl mb-3">🏆</div>
                            <div className="text-2xl font-bold text-green-400 mb-2">First</div>
                            <div className="text-sm text-slate-300">AI-Native IELTS Game</div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <div className="text-sm text-slate-400 mb-2">Current Valuation Target</div>
                        <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                            $10M
                        </div>
                        <div className="text-slate-400 mt-2">10x potential within 24 months</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeriesADataRoom;
