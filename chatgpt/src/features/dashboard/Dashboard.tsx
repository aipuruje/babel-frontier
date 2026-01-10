// Dashboard - Player home screen

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlayerState } from '../../lib/playerState';
import { getRankProgression, getNextRank, getAvailableZonesForRank } from '../../lib/questData';
import type { RankInfo, Zone } from '../../lib/types';
import './Dashboard.css';

export default function Dashboard() {
    const { t } = useTranslation();
    const { playerState } = usePlayerState();
    const [currentRankInfo, setCurrentRankInfo] = useState<RankInfo | null>(null);
    const [nextRankInfo, setNextRankInfo] = useState<RankInfo | null>(null);
    const [availableZones, setAvailableZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const ranks = await getRankProgression();
                const currentRank = ranks.find(r => r.rank === playerState.rank);
                const nextRank = await getNextRank(playerState.rank);
                const zones = await getAvailableZonesForRank(playerState.rank);

                setCurrentRankInfo(currentRank || null);
                setNextRankInfo(nextRank);
                setAvailableZones(zones);
            } catch (error) {
                console.error('Failed to load dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [playerState.rank]);

    if (loading) {
        return (
            <div className="dashboard">
                <div className="loading-state">{t('common.loading')}</div>
            </div>
        );
    }

    const xpProgress = nextRankInfo
        ? ((playerState.xp - (currentRankInfo?.xpRequired || 0)) /
            (nextRankInfo.xpRequired - (currentRankInfo?.xpRequired || 0))) * 100
        : 100;

    return (
        <div className="dashboard">
            <section className="welcome-section">
                <h2 className="welcome-title">Welcome to the Archive, {playerState.userId}</h2>
                <p className="welcome-subtitle">Current Rank: {currentRankInfo?.name.en || 'Unknown'}</p>
            </section>

            <div className="dashboard-grid">
                <div className="card rank-progress-card">
                    <h3>Your Progress</h3>
                    <div className="rank-display">
                        <div className="current-rank">
                            <span className="rank-number">{playerState.rank}</span>
                            <span className="rank-name">{currentRankInfo?.name.en}</span>
                        </div>
                        {nextRankInfo && (
                            <>
                                <div className="progress-arrow">→</div>
                                <div className="next-rank">
                                    <span className="rank-number">{nextRankInfo.rank}</span>
                                    <span className="rank-name">{nextRankInfo.name.en}</span>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="xp-progress">
                        <div className="xp-label">
                            <span>{playerState.xp} XP</span>
                            {nextRankInfo && <span>{nextRankInfo.xpRequired} XP</span>}
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${Math.min(xpProgress, 100)}%` }} />
                        </div>
                    </div>
                </div>

                <div className="card mastery-card">
                    <h3>{t('dashboard.mastery')}</h3>
                    <div className="mastery-bars">
                        {Object.entries(playerState.mastery).map(([skill, value]) => (
                            <div key={skill} className="mastery-item">
                                <div className="mastery-label">
                                    {skill.charAt(0).toUpperCase() + skill.slice(1)}
                                </div>
                                <div className="progress-bar mastery-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${value * 100}%` }}
                                    />
                                </div>
                                <div className="mastery-value">{Math.round(value * 100)}%</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card quick-stats-card">
                    <h3>Quick Stats</h3>
                    <div className="stats-grid">
                        <div className="stat-box">
                            <div className="stat-icon">✦</div>
                            <div className="stat-info">
                                <div className="stat-value text-gold">{playerState.inventory.shards}</div>
                                <div className="stat-label">{t('dashboard.shards')}</div>
                            </div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-icon">🔥</div>
                            <div className="stat-info">
                                <div className="stat-value">{playerState.streak}</div>
                                <div className="stat-label">{t('dashboard.streak')}</div>
                            </div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-icon">🎒</div>
                            <div className="stat-info">
                                <div className="stat-value">{playerState.inventory.items.length}</div>
                                <div className="stat-label">Items</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card available-zones-card">
                    <h3>Available Zones</h3>
                    <div className="zones-list">
                        {availableZones.map(zone => (
                            <Link
                                key={zone.id}
                                to={`/zones/${zone.id}/quests`}
                                className="zone-link"
                            >
                                <div className="zone-name">{zone.title.en}</div>
                                <div className="zone-theme">{zone.theme}</div>
                            </Link>
                        ))}
                    </div>
                    <Link to="/zones" className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }}>
                        View World Map
                    </Link>
                </div>
            </div>
        </div>
    );
}
