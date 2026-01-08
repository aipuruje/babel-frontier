import { useState, useEffect, useCallback } from 'react';

const DailyNationalChallenge = () => { // userId removed - will be added when needed for user-specific data
    const [challenge, setChallenge] = useState(null);
    const [userParticipation, setUserParticipation] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDailyChallenge = useCallback(async () => {
        try {
            const response = await fetch('https://babel-frontier.rahrus1977.workers.dev/api/auto-forge/daily-challenge');
            const data = await response.json();

            if (data.challenge) {
                setChallenge(data.challenge);
                // Parse mission IDs from JSON string
                if (data.challenge.mission_ids) {
                    try {
                        const missionIds = JSON.parse(data.challenge.mission_ids);
                        setChallenge(prev => ({ ...prev, parsedMissionIds: missionIds }));
                    } catch (e) {
                        console.error('Failed to parse mission IDs:', e);
                    }
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch daily challenge:', error);
            setLoading(false);
        }
    }, []); // Empty dependency array since this shouldn't change

    useEffect(() => {
        fetchDailyChallenge();
    }, [fetchDailyChallenge]); // Now includes fetchDailyChallenge


    if (loading) {
        return (
            <div className="daily-challenge loading">
                <div className="spinner"></div>
                <p>Loading today's national challenge...</p>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="daily-challenge no-challenge">
                <h3>🌅 Daily National Challenge</h3>
                <p>No active challenge for today. Check back at 4:00 AM!</p>
            </div>
        );
    }

    const progressPercentage = challenge.goal_target > 0
        ? ((challenge.current_progress / challenge.goal_target) * 100).toFixed(1)
        : 0;

    return (
        <div className="daily-national-challenge">
            <div className="challenge-header">
                <div className="title-section">
                    <h2>🌅 Today's National Mission</h2>
                    <h3>{challenge.title}</h3>
                    {challenge.title_uz && (
                        <p className="title-uz">{challenge.title_uz}</p>
                    )}
                </div>
                <div className="challenge-date">
                    <span className="icon">📅</span>
                    <span>{new Date(challenge.challenge_date).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="challenge-description">
                <p>{challenge.description}</p>
            </div>

            <div className="weakness-analysis">
                <h4>🎯 Why This Matters</h4>
                <p>{challenge.weakness_analysis}</p>
                <div className="weaknesses-addressed">
                    <span className="label">Addressing:</span>
                    <div className="weakness-tags">
                        {challenge.top_weakness_1 && (
                            <span className="weakness-tag primary">
                                {challenge.top_weakness_1.replace(/_/g, ' ')}
                            </span>
                        )}
                        {challenge.top_weakness_2 && (
                            <span className="weakness-tag">
                                {challenge.top_weakness_2.replace(/_/g, ' ')}
                            </span>
                        )}
                        {challenge.top_weakness_3 && (
                            <span className="weakness-tag">
                                {challenge.top_weakness_3.replace(/_/g, ' ')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="collective-progress">
                <div className="progress-header">
                    <h4>🇺🇿 National Progress</h4>
                    <span className="participants">
                        {challenge.participants.toLocaleString()} participants
                    </span>
                </div>

                <div className="progress-bar-container">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        >
                            {progressPercentage >= 15 && (
                                <span className="progress-text">
                                    {progressPercentage}%
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="progress-numbers">
                        <span className="current">{challenge.current_progress.toLocaleString()}</span>
                        <span className="separator">/</span>
                        <span className="target">{challenge.goal_target.toLocaleString()}</span>
                        <span className="metric">{challenge.goal_metric.replace(/_/g, ' ')}</span>
                    </div>
                </div>

                {progressPercentage >= 100 ? (
                    <div className="goal-reached">
                        <span className="icon">🎉</span>
                        <span className="message">GOAL REACHED! Uzbekistan has mastered today's challenge!</span>
                    </div>
                ) : (
                    <div className="challenge-call-to-action">
                        <p>We need <strong>{(challenge.goal_target - challenge.current_progress).toLocaleString()}</strong> more completions to reach our goal!</p>
                    </div>
                )}
            </div>

            {challenge.parsedMissionIds && challenge.parsedMissionIds.length > 0 && (
                <div className="challenge-missions">
                    <h4>📋 Today's Missions</h4>
                    <p>Complete all {challenge.parsedMissionIds.length} missions to contribute to the national goal:</p>
                    <div className="mission-list">
                        {challenge.parsedMissionIds.map((missionId, index) => (
                            <div key={missionId} className="mission-card">
                                <span className="mission-number">{index + 1}</span>
                                <span className="mission-id">Mission ID: {missionId}</span>
                                <button className="start-mission-btn">Start</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="reward-section">
                <div className="reward-header">
                    <span className="icon">🏆</span>
                    <h4>Collective Reward</h4>
                </div>
                <p className="reward-description">{challenge.reward_description}</p>
                <div className="reward-badge">
                    <span className="badge-icon">🎖️</span>
                    <span className="badge-name">{challenge.reward_badge_name}</span>
                </div>
            </div>

            <div className="challenge-footer">
                <p className="expires-notice">
                    ⏰ Challenge expires at <strong>23:59 today</strong>
                </p>
                <button className="contribute-btn">
                    🚀 Contribute to National Goal
                </button>
            </div>
        </div>
    );
};

export default DailyNationalChallenge;
