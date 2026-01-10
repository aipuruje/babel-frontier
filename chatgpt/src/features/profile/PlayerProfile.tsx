// Player Profile with Achievements

import { useState } from 'react';
import Achievements from './Achievements';
import { usePlayerState } from '../../lib/playerState';
import './PlayerProfile.css';

export default function PlayerProfile() {
    const { playerState } = usePlayerState();
    const [activeTab, setActiveTab] = useState<'overview' | 'achievements'>('overview');

    return (
        <div className="player-profile">
            <div className="profile-tabs">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    👤 Overview
                </button>
                <button
                    className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
                    onClick={() => setActiveTab('achievements')}
                >
                    🏆 Achievements
                </button>
            </div>

            {activeTab === 'overview' ? (
                <div className="profile-overview">
                    <div className="profile-card">
                        <div className="profile-avatar">👤</div>
                        <h2 className="profile-name">{playerState.userId}</h2>
                        <div className="profile-rank">Rank {playerState.rank}</div>
                    </div>

                    <div className="profile-stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">⭐</div>
                            <div className="stat-value">{playerState.xp}</div>
                            <div className="stat-label">Total XP</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">✦</div>
                            <div className="stat-value">{playerState.shards || 0}</div>
                            <div className="stat-label">Rune Shards</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🔥</div>
                            <div className="stat-value">{playerState.streak}</div>
                            <div className="stat-label">Day Streak</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">📚</div>
                            <div className="stat-value">{playerState.questsCompleted || 0}</div>
                            <div className="stat-label">Quests Done</div>
                        </div>
                    </div>

                    <div className="mastery-overview">
                        <h3>Mastery Skills</h3>
                        {Object.entries(playerState.mastery || {}).map(([skill, value]) => (
                            <div key={skill} className="mastery-row">
                                <span className="mastery-skill">{skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
                                <div className="mastery-bar">
                                    <div
                                        className="mastery-fill"
                                        style={{ width: `${value * 100}%` }}
                                    />
                                </div>
                                <span className="mastery-percent">{Math.round(value * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <Achievements />
            )}
        </div>
    );
}

