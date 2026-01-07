import { useState, useEffect } from 'react';
import './MomentumLeaderboard.css';

export default function MomentumLeaderboard({ userId }) {
    const [podData, setPodData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lifting, setLifting] = useState(null);

    useEffect(() => {
        fetchRankings();
    }, []);

    const fetchRankings = async () => {
        try {
            const res = await fetch(`/api/social/pod-rankings?userId=${userId}`);
            const data = await res.json();
            setPodData(data);
        } catch (err) {
            console.error("Failed to fetch pod rankings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLift = async (targetId) => {
        setLifting(targetId);
        try {
            const res = await fetch('/api/social/lift', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromUserId: userId, toUserId: targetId })
            });
            const result = await res.json();
            if (result.success) {
                alert(result.message);
                fetchRankings(); // Refresh scores
            }
        } catch (err) {
            console.error("Lift failed:", err);
        } finally {
            setLifting(null);
        }
    };

    if (loading) return <div className="pod-loader">Syncing Pod Frequencies...</div>;

    return (
        <div className="pod-formation-container">
            <header className="pod-header">
                <h2>🛰️ {podData.podName}</h2>
                <div className="pod-velocity">
                    <span>Pod Average Momentum: </span>
                    <span className="momentum-value">{podData.avgMomentum}%</span>
                </div>
                {podData.avgMomentum >= 80 && (
                    <div className="premium-unlock-badge">🚀 PREMIUM MISSION UNLOCKED</div>
                )}
            </header>

            <div className="formation-list">
                {podData.rankings.map((user, index) => (
                    <div key={user.user_id} className={`formation-row ${user.user_id === userId ? 'is-self' : ''}`}>
                        <div className="rank">#{index + 1}</div>
                        <div className="user-info">
                            <span className="username">{user.username}</span>
                            <span className={`velocity-icon ${user.velocity}`}>▲</span>
                        </div>
                        <div className="momentum-bar-container">
                            <div className="momentum-bar" style={{ width: `${user.momentum_score}%` }}></div>
                            <span className="momentum-pct">{user.momentum_score.toFixed(0)}%</span>
                        </div>
                        {user.user_id !== userId && (
                            <button
                                className={`lift-btn ${user.momentum_score < 40 ? 'needs-lift' : ''}`}
                                onClick={() => handleLift(user.user_id)}
                                disabled={lifting === user.user_id}
                            >
                                {lifting === user.user_id ? '⚡' : '💓'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
