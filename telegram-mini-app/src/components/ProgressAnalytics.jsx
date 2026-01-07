import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Custom tooltip component (moved outside to avoid recreation on each render)
const CustomTooltip = ({ active, payload }) =\u003e {
    if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
    \u003cdiv className = "progress-tooltip"\u003e
    \u003cp className = "tooltip-date"\u003e{ new Date(data.date).toLocaleDateString() } \u003c / p\u003e
    \u003cp className = "tooltip-score"\u003eRaw Score: \u003cb\u003e{ data.rawScore.toFixed(2) } \u003c / b\u003e\u003c / p\u003e
    \u003cp className = "tooltip-band"\u003eBand: \u003cb\u003e{ data.roundedBand } \u003c / b\u003e\u003c / p\u003e
    \u003cp className = "tooltip-type"\u003e{ data.submissionType } \u003c / p\u003e
    \u003c / div\u003e
        );
}
return null;
};

/**
 * Progress Analytics Component - Shows internal score progression
 * 
 * Features:
 * - Line chart showing raw scores over time
 * - "X points away from Band Y" messaging
 * - Weekly progress percentage
 * 
 * Props:
 * - progressData: Array of {date, rawScore, roundedBand, submissionType}
 * - skillDomain: 'speaking' or 'writing'
 */
const ProgressAnalytics = ({ progressData, skillDomain = 'speaking' }) => {
    if (!progressData || progressData.length === 0) {
        return (
            <div className="progress-analytics-empty">
                <p>No progress data yet. Complete more missions to see your growth! 🚀</p>
            </div>
        );
    }

    // Calculate stats
    const latestEntry = progressData[progressData.length - 1];
    const oldestEntry = progressData[0];
    const improvement = latestEntry.rawScore - oldestEntry.rawScore;
    const nextBandTarget = Math.ceil(latestEntry.rawScore * 2) / 2; // Round up to nearest 0.5
    const pointsToNext = nextBandTarget - latestEntry.rawScore;

    // Calculate weekly improvement
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoData = progressData.find(d => new Date(d.date) >= weekAgo);
    const weeklyImprovement = weekAgoData
        ? latestEntry.rawScore - weekAgoData.rawScore
        : improvement;

    return (
        <div className="progress-analytics">
            <div className="progress-header">
                <h3>📈 {skillDomain === 'speaking' ? 'Speaking' : 'Writing'} Progress Tracker</h3>
                <div className="progress-stats">
                    <div className="stat-card improvement">
                        <span className="stat-label">Total Improvement</span>
                        <span className="stat-value">{improvement > 0 ? '+' : ''}{improvement.toFixed(2)}</span>
                    </div>
                    <div className="stat-card weekly">
                        <span className="stat-label">This Week</span>
                        <span className="stat-value">{weeklyImprovement > 0 ? '+' : ''}{weeklyImprovement.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={progressData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            stroke="#aaa"
                            style={{ fontSize: '0.85rem' }}
                        />
                        <YAxis
                            domain={[4, 9]}
                            ticks={[4, 5, 6, 7, 8, 9]}
                            stroke="#aaa"
                            style={{ fontSize: '0.85rem' }}
                            label={{ value: 'IELTS Band Score', angle: -90, position: 'insideLeft', fill: '#ffd93d' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="rawScore"
                            stroke="url(#colorGradient)"
                            strokeWidth={3}
                            dot={{ r: 6, fill: '#667eea', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 8, fill: '#ffd93d' }}
                        />
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#667eea" />
                                <stop offset="100%" stopColor="#764ba2" />
                            </linearGradient>
                        </defs>
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="progress-message">
                <div className="message-card">
                    <div className="message-icon">🎯</div>
                    <div className="message-content">
                        <h4>You're Almost There!</h4>
                        <p>
                            Current Internal Score: <b>{latestEntry.rawScore.toFixed(2)}</b>
                            {' '}(Official Band: <b>{latestEntry.roundedBand}</b>)
                        </p>
                        <p className="next-target">
                            You're only <b className="highlight">{pointsToNext.toFixed(2)} points</b> away from Band <b>{nextBandTarget}</b>! 🚀
                        </p>
                        {weeklyImprovement > 0 && (
                            <p className="weekly-praise">
                                Amazing! You've improved by <b>{weeklyImprovement.toFixed(2)} points</b> this week.
                                Keep this momentum! 💪
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .progress-analytics {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    padding: 24px;
                    color: #fff;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }

                .progress-analytics-empty {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    padding: 48px 24px;
                    text-align: center;
                    color: #aaa;
                    font-size: 1.1rem;
                }

                .progress-header {
                    margin-bottom: 24px;
                }

                .progress-header h3 {
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin-bottom: 16px;
                    background: linear-gradient(135deg, #ffd93d 0%, #ff8c42 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .progress-stats {
                    display: flex;
                    gap: 16px;
                }

                .stat-card {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .stat-label {
                    font-size: 0.85rem;
                    color: #aaa;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .stat-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #66ff66;
                }

                .chart-container {
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 12px;
                    padding: 16px;
                    margin-bottom: 24px;
                }

                .progress-tooltip {
                    background: rgba(0, 0, 0, 0.9);
                    border: 2px solid #667eea;
                    border-radius: 8px;
                    padding: 12px;
                    color: #fff;
                }

                .tooltip-date {
                    font-size: 0.85rem;
                    color: #aaa;
                    margin-bottom: 4px;
                }

                .tooltip-score, .tooltip-band, .tooltip-type {
                    font-size: 0.9rem;
                    margin: 2px 0;
                }

                .tooltip-type {
                    color: #ffd93d;
                    text-transform: capitalize;
                }

                .progress-message {
                    margin-top: 20px;
                }

                .message-card {
                    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
                    border: 2px solid rgba(102, 126, 234, 0.3);
                    border-radius: 12px;
                    padding: 20px;
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                }

                .message-icon {
                    font-size: 2.5rem;
                }

                .message-content h4 {
                    font-size: 1.2rem;
                    margin: 0 0 8px 0;
                    color: #ffd93d;
                }

                .message-content p {
                    margin: 6px 0;
                    font-size: 1rem;
                    line-height: 1.5;
                }

                .next-target {
                    color: #fff;
                    font-size: 1.1rem !important;
                    margin-top: 8px !important;
                }

                .highlight {
                    color: #66ff66;
                    font-size: 1.2rem;
                }

                .weekly-praise {
                    color: #aaffaa;
                    margin-top: 12px !important;
                    padding-top: 12px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                @media (max-width: 768px) {
                    .progress-stats {
                        flex-direction: column;
                    }

                    .message-card {
                        flex-direction: column;
                        text-align: center;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProgressAnalytics;
