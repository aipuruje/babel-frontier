import { useState, useEffect } from 'react';

const RegionalEventsPanel = ({ userId }) => {
    const [events, setEvents] = useState([]);
    const [userRegion, setUserRegion] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchRegionalEvents();
        }
    }, [userId]);

    const fetchRegionalEvents = async () => {
        try {
            const response = await fetch(`https://babel-frontier.rahrus1977.workers.dev/api/auto-forge/active-regional-events/${userId}`);
            const data = await response.json();
            setEvents(data.events || []);
            setUserRegion(data.region || '');
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch regional events:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="regional-events-panel loading">
                <div className="spinner"></div>
                <p>Loading regional events...</p>
            </div>
        );
    }

    if (!userRegion) {
        return (
            <div className="regional-events-panel no-region">
                <h3>🗺️ Regional Events</h3>
                <p>Set your location to unlock regional challenges</p>
            </div>
        );
    }

    return (
        <div className="regional-events-panel">
            <div className="panel-header">
                <h3>🗺️ Regional Events</h3>
                <div className="region-badge">
                    📍 {userRegion}
                </div>
            </div>

            {events.length === 0 ? (
                <div className="no-events">
                    <p>No active regional events. Your region is performing well!</p>
                    <span className="emoji">✨</span>
                </div>
            ) : (
                <div className="events-list">
                    {events.map((event) => (
                        <div key={event.id} className="regional-event-card">
                            <div className="event-header">
                                <h4>{event.title}</h4>
                                <span className="status-badge active">ACTIVE</span>
                            </div>

                            {event.title_uz && (
                                <p className="title-uz">{event.title_uz}</p>
                            )}

                            <div className="event-meta">
                                <div className="meta-item">
                                    <span className="icon">🎯</span>
                                    <span className="label">Target Skill:</span>
                                    <span className="value">{event.target_skill}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="icon">⚔️</span>
                                    <span className="label">Difficulty:</span>
                                    <span className="value">Band {event.difficulty_band}</span>
                                </div>
                                <div className="meta-item">
                                    <span className="icon">🏛️</span>
                                    <span className="label">Landmark:</span>
                                    <span className="value">{event.local_landmark}</span>
                                </div>
                            </div>

                            <div className="event-stats">
                                <div className="stat">
                                    <span className="number">{event.participant_count || 0}</span>
                                    <span className="label">Participants</span>
                                </div>
                                <div className="stat">
                                    <span className="number">{(event.completion_rate * 100).toFixed(0)}%</span>
                                    <span className="label">Completion</span>
                                </div>
                                <div className="stat">
                                    <span className="number">+{event.avg_improvement?.toFixed(1) || '0.0'}</span>
                                    <span className="label">Avg Improvement</span>
                                </div>
                            </div>

                            <div className="event-timer">
                                <span className="icon">⏰</span>
                                <span>Expires: {new Date(event.active_until).toLocaleString()}</span>
                            </div>

                            <button className="play-event-btn">
                                🚀 Defend {userRegion}'s Honor
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="regional-help-message">
                <p>💡 <strong>Regional Events</strong> target weaknesses specific to {userRegion}. Complete them to help your region rise in the national rankings!</p>
            </div>
        </div>
    );
};

export default RegionalEventsPanel;
