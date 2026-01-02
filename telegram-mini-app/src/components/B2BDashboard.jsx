import { useState } from 'react';

const B2BDashboard = () => {
    const [authToken, setAuthToken] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [_partnerId, setPartnerId] = useState(null);
    const [leads, setLeads] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = () => {
        // Simple token-based auth
        // In production, tokens would be provided during partner registration
        const validTokens = {
            'partner_uk_001': 1,
            'partner_uz_001': 2,
            'partner_us_001': 3
        };

        if (validTokens[authToken]) {
            setIsAuthenticated(true);
            setPartnerId(validTokens[authToken]);
            loadDashboardData(validTokens[authToken], authToken);
        } else {
            alert('Invalid authentication token');
        }
    };

    const loadDashboardData = async (id, token) => {
        setLoading(true);
        try {
            // Load leads
            const leadsResponse = await fetch(`/api/b2b/partners/${id}/leads?auth_token=${token}`);
            const leadsData = await leadsResponse.json();
            setLeads(leadsData.leads || []);

            // Load analytics
            const analyticsResponse = await fetch(`/api/b2b/analytics/${id}?auth_token=${token}`);
            const analyticsData = await analyticsResponse.json();
            setAnalytics(analyticsData.analytics);

        } catch (error) {
            console.error('Load dashboard error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                    <div className="text-center mb-8">
                        <span className="text-6xl block mb-4">🏛️</span>
                        <h2 className="text-2xl font-bold">B2B Partner Portal</h2>
                        <p className="text-sm text-slate-400 mt-2">Universities & Study Centers</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-slate-300 mb-2">Authentication Token</label>
                            <input
                                type="password"
                                value={authToken}
                                onChange={(e) => setAuthToken(e.target.value)}
                                placeholder="Enter your partner token"
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500"
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                            />
                        </div>

                        <button
                            onClick={handleLogin}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 font-bold rounded-lg transition-all"
                        >
                            🔐 Login to Dashboard
                        </button>

                        <div className="text-xs text-slate-500 text-center mt-4">
                            Demo tokens: partner_uk_001, partner_uz_001, partner_us_001
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">University Partner Dashboard</h1>
                        <p className="text-slate-400 text-sm">Manage leads and track placement performance</p>
                    </div>
                    <button
                        onClick={() => setIsAuthenticated(false)}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm transition-all"
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Analytics Cards */}
            {analytics && (
                <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                        <div className="text-sm text-blue-300 mb-2">Total Leads</div>
                        <div className="text-4xl font-bold">{analytics.total_leads}</div>
                    </div>

                    <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30">
                        <div className="text-sm text-green-300 mb-2">Consultations</div>
                        <div className="text-4xl font-bold">{analytics.consultations_booked}</div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                        <div className="text-sm text-purple-300 mb-2">Avg Band Score</div>
                        <div className="text-4xl font-bold">{analytics.avg_band_score?.toFixed(1) || '0.0'}</div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-900/50 to-orange-800/50 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
                        <div className="text-sm text-yellow-300 mb-2">Conversion Rate</div>
                        <div className="text-4xl font-bold">{analytics.conversion_rate}%</div>
                    </div>
                </div>
            )}

            {/* Leads Table */}
            <div className="max-w-7xl mx-auto">
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <div className="p-6 border-b border-white/20">
                        <h2 className="text-xl font-bold">📋 Qualified Leads (Band 7.5+)</h2>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            <div className="mt-4 text-slate-400">Loading leads...</div>
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <span className="text-5xl block mb-4">📭</span>
                            <div>No leads yet. Students will appear here when they reach Band 7.5+</div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr className="text-left text-sm text-slate-400">
                                        <th className="p-4">Student ID</th>
                                        <th className="p-4">Band Score</th>
                                        <th className="p-4">Target Country</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Created</th>
                                        <th className="p-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <tr key={lead.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-mono text-sm">{lead.user_id}</td>
                                            <td className="p-4">
                                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-bold">
                                                    {lead.band_score}
                                                </span>
                                            </td>
                                            <td className="p-4">{lead.target_country || 'Not specified'}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.status === 'new' ? 'bg-blue-500/20 text-blue-300' :
                                                    lead.status === 'consultation_booked' ? 'bg-green-500/20 text-green-300' :
                                                        lead.status === 'placed' ? 'bg-purple-500/20 text-purple-300' :
                                                            'bg-gray-500/20 text-gray-300'
                                                    }`}>
                                                    {lead.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-slate-400">
                                                {new Date(lead.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <button className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-sm transition-all">
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Revenue Calculator */}
            {analytics && analytics.total_leads > 0 && (
                <div className="max-w-7xl mx-auto mt-8 bg-gradient-to-r from-green-900/30 to-emerald-900/30 backdrop-blur-lg rounded-2xl p-8 border border-green-500/30">
                    <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                        <span>💰</span> Revenue Projection
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-green-300 mb-2">Placement Fee per Lead</div>
                            <div className="text-2xl font-bold">1,000,000 UZS</div>
                            <div className="text-xs text-slate-400 mt-1">~$85 USD</div>
                        </div>
                        <div>
                            <div className="text-sm text-green-300 mb-2">Potential Revenue (All Leads)</div>
                            <div className="text-2xl font-bold">{(analytics.total_leads * 1000000).toLocaleString()} UZS</div>
                            <div className="text-xs text-slate-400 mt-1">~${(analytics.total_leads * 85).toLocaleString()} USD</div>
                        </div>
                        <div>
                            <div className="text-sm text-green-300 mb-2">Expected Placements (20% conv.)</div>
                            <div className="text-2xl font-bold">{Math.round(analytics.total_leads * 0.2)}</div>
                            <div className="text-xs text-slate-400 mt-1">Conservative estimate</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default B2BDashboard;
