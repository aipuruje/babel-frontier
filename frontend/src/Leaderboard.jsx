import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import './Leaderboard.css'

function Leaderboard() {
    const [leaderboard, setLeaderboard] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchLeaderboard()
    }, [])

    const fetchLeaderboard = async () => {
        try {
            const response = await axios.get('/leaderboard?limit=10')
            // Defensive: ensure we always have an array
            const data = response.data?.leaderboard || []
            setLeaderboard(Array.isArray(data) ? data : [])
            setLoading(false)
        } catch (err) {
            console.error('Error fetching leaderboard:', err)
            setError('Unable to load leaderboard')
            setLeaderboard([]) // Ensure it's an array even on error
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <motion.div
                className="leaderboard-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <h3 className="leaderboard-title">🏆 Hall of Fame</h3>
                <div className="leaderboard-loading">Loading scores...</div>
            </motion.div>
        )
    }

    if (error) {
        return (
            <motion.div
                className="leaderboard-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <h3 className="leaderboard-title">🏆 Hall of Fame</h3>
                <div className="leaderboard-empty">No scores yet. Be the first!</div>
            </motion.div>
        )
    }

    return (
        <motion.div
            className="leaderboard-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
        >
            <h3 className="leaderboard-title">🏆 Hall of Fame</h3>
            {leaderboard.length === 0 ? (
                <div className="leaderboard-empty">
                    No warriors yet. Start speaking to claim the top spot!
                </div>
            ) : (
                <div className="leaderboard-list">
                    {leaderboard.map((player, index) => (
                        <motion.div
                            key={player.user_id}
                            className={`leaderboard-item ${index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : ''}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                        >
                            <div className="rank">
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </div>
                            <div className="player-info">
                                <div className="player-name">{player.username}</div>
                                <div className="player-stats">
                                    <span className="stat-badge">{player.best_band || 'Band 9.0'}</span>
                                    <span className="stat-damage">{player.total_damage} damage</span>
                                    <span className="stat-attempts">{player.attempts} attempts</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}

export default Leaderboard
