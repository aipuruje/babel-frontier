import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import WebApp from '@twa-dev/sdk'
import Leaderboard from './Leaderboard'
import './App.css'
import pedagogyManifest from '../pedagogy-manifest.json'

// Initialize Telegram Web App
WebApp.ready()
WebApp.expand()

// Helper function to calculate Band score from damage
const calculateBandScore = (damage) => {
    const bands = pedagogyManifest.band_progression
    for (const [bandKey, bandData] of Object.entries(bands)) {
        const [min, max] = bandData.damage_range
        if (damage >= min && damage <= max) {
            return {
                band: bandKey,
                label: bandData.label,
                color: bandData.color,
                icon: bandData.icon,
                description: bandData.description
            }
        }
    }
    return bands['band_3.5'] // Default to lowest band
}

function App() {
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [totalDamage, setTotalDamage] = useState(0)
    const [lastResult, setLastResult] = useState(null)
    const [gameOver, setGameOver] = useState(false)
    const [showDamage, setShowDamage] = useState(false)
    const [health, setHealth] = useState(100)
    const [currentBand, setCurrentBand] = useState(calculateBandScore(0))
    const [activeSkill] = useState('speaking')
    const [user, setUser] = useState(null)
    const [showShareModal, setShowShareModal] = useState(false)

    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const streamRef = useRef(null)

    // Get Telegram user info
    useEffect(() => {
        if (WebApp.initDataUnsafe?.user) {
            setUser(WebApp.initDataUnsafe.user)
            // Set Telegram theme colors
            document.documentElement.style.setProperty('--tg-theme-bg-color', WebApp.backgroundColor)
            document.documentElement.style.setProperty('--tg-theme-text-color', WebApp.textColor)
        } else {
            // Fallback for standalone/browser testing
            setUser({
                id: 'guest',
                first_name: 'Guest',
                last_name: 'Warrior',
                username: 'guest_player',
                photo_url: null
            })
        }
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
                await sendAudioToAPI(audioBlob)

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop())
                }
            }

            mediaRecorder.start()
            setIsRecording(true)
            WebApp.HapticFeedback.impactOccurred('medium')
        } catch (error) {
            console.error('Error accessing microphone:', error)
            WebApp.showAlert('Please allow microphone access to use this feature.')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsProcessing(true)
            WebApp.HapticFeedback.impactOccurred('light')
        }
    }

    const sendAudioToAPI = async (audioBlob) => {
        try {
            const formData = new FormData()
            formData.append('audio', audioBlob, 'recording.webm')

            // Add user context if available
            if (user) {
                formData.append('user_id', user.id)
                formData.append('username', user.username || user.first_name)
            }

            const response = await axios.post('/analyze-speech', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })

            const data = response.data
            setLastResult(data)

            const newDamage = totalDamage + data.damage
            setTotalDamage(newDamage)

            const bandScore = calculateBandScore(newDamage)
            setCurrentBand(bandScore)

            const newHealth = Math.max(0, 100 - newDamage)
            setHealth(newHealth)

            if (data.damage > 0) {
                setShowDamage(true)
                WebApp.HapticFeedback.notificationOccurred('error')
                setTimeout(() => setShowDamage(false), 1500)
            } else {
                WebApp.HapticFeedback.notificationOccurred('success')
            }

            if (newDamage > 50) {
                setGameOver(true)
                setShowShareModal(true)
            }

            setIsProcessing(false)
        } catch (error) {
            console.error('Error sending audio:', error)
            setIsProcessing(false)
            WebApp.showAlert('Error analyzing speech. Please ensure the backend is running.')
        }
    }

    const resetGame = () => {
        setTotalDamage(0)
        setHealth(100)
        setCurrentBand(calculateBandScore(0))
        setGameOver(false)
        setLastResult(null)
        setShowDamage(false)
        setShowShareModal(false)
    }

    const shareScore = () => {
        const message = `🎤 I just scored ${currentBand.band.replace('_', ' ').toUpperCase()} in IELTS Speech Fighter!\n\n${currentBand.label}: ${currentBand.description}\n\nCan you beat my score?`

        const url = `https://t.me/share/url?url=${encodeURIComponent('https://t.me/ielts_rater_bot')}&text=${encodeURIComponent(message)}`

        WebApp.openTelegramLink(url)
        WebApp.HapticFeedback.notificationOccurred('success')
    }

    const inviteFriend = () => {
        const inviteUrl = `https://t.me/ielts_rater_bot?start=invite_${user?.id || 'guest'}`
        const message = `🚀 Join me in IELTS Speech Fighter! Master your IELTS speaking skills through an epic RPG adventure.\n\n🎯 Track your Band score progress\n🎮 Battle hesitation and improve fluency\n🏆 Compete with friends\n\nStart your journey: ${inviteUrl}`

        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(message)}`

        WebApp.openTelegramLink(shareUrl)
    }

    return (
        <div className="app">
            <div className="game-container">
                {/* Telegram User Header */}
                {user && (
                    <motion.div
                        className="user-header"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="user-info">
                            {user.photo_url && (
                                <img src={user.photo_url} alt={user.first_name} className="user-avatar" />
                            )}
                            <div>
                                <div className="user-name">{user.first_name} {user.last_name}</div>
                                <div className="user-username">@{user.username || 'linguist'}</div>
                            </div>
                        </div>
                        <button className="invite-btn" onClick={inviteFriend}>
                            <span>➕ Invite</span>
                        </button>
                    </motion.div>
                )}

                {/* Header */}
                <motion.div
                    className="header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="title text-gradient">IELTS Speech Fighter</h1>
                    <p className="subtitle">Master your fluency, defeat hesitation</p>

                    {/* Current Band Display */}
                    <motion.div
                        className="band-display"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="band-icon" style={{ fontSize: '2rem' }}>{currentBand.icon}</div>
                        <div className="band-info">
                            <div className="band-label" style={{ color: currentBand.color }}>
                                {currentBand.band.replace('_', ' ').toUpperCase()}
                            </div>
                            <div className="band-description">{currentBand.label}</div>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Health Bar */}
                <motion.div
                    className="health-container"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="health-label">
                        <span>Health</span>
                        <span className="health-value">{health}%</span>
                    </div>
                    <div className="health-bar-bg">
                        <motion.div
                            className="health-bar-fill"
                            initial={{ width: '100%' }}
                            animate={{
                                width: `${health}%`,
                                background: health > 50
                                    ? 'var(--gradient-success)'
                                    : health > 25
                                        ? 'var(--gradient-warning)'
                                        : 'var(--gradient-danger)'
                            }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <div className="damage-label">Total Damage: {totalDamage}</div>
                </motion.div>

                {/* Main Game Area */}
                <div className="game-area">
                    <AnimatePresence>
                        {!gameOver ? (
                            <motion.div
                                key="game"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="game-active"
                            >
                                <motion.button
                                    className={`speak-button ${isRecording ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
                                    onMouseDown={!isProcessing ? startRecording : null}
                                    onMouseUp={stopRecording}
                                    onTouchStart={!isProcessing ? startRecording : null}
                                    onTouchEnd={stopRecording}
                                    disabled={isProcessing}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="button-icon">
                                        {isProcessing ? '⏳' : isRecording ? '🎙️' : '🎤'}
                                    </span>
                                    <span className="button-text">
                                        {isProcessing ? 'Analyzing...' : isRecording ? 'Release to Stop' : 'Hold to Speak'}
                                    </span>
                                    {isRecording && (
                                        <motion.div
                                            className="recording-indicator"
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ repeat: Infinity, duration: 1 }}
                                        />
                                    )}
                                </motion.button>

                                {lastResult && (
                                    <motion.div
                                        className="result-card"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <h3 className="result-title">Last Analysis</h3>
                                        <div className="result-content">
                                            <div className="result-row">
                                                <span className="result-label">Transcription:</span>
                                                <span className="result-value">"{lastResult.transcription}"</span>
                                            </div>
                                            <div className="result-row">
                                                <span className="result-label">Word Count:</span>
                                                <span className="result-value">{lastResult.word_count}</span>
                                            </div>
                                            <div className="result-row">
                                                <span className="result-label">Max Pause:</span>
                                                <span className="result-value">{lastResult.max_pause_duration}s</span>
                                            </div>
                                            <div className="result-row">
                                                <span className="result-label">Damage:</span>
                                                <span className={`result-value ${lastResult.damage > 0 ? 'damage' : 'success'}`}>
                                                    {lastResult.damage}
                                                </span>
                                            </div>
                                            <div className={`feedback ${lastResult.damage > 0 ? 'warning' : 'success'}`}>
                                                {lastResult.feedback}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                <AnimatePresence>
                                    {showDamage && lastResult && lastResult.damage > 0 && (
                                        <motion.div
                                            className="damage-popup"
                                            initial={{ opacity: 0, scale: 0.5, y: 0 }}
                                            animate={{ opacity: 1, scale: 1.5, y: -100 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 1.5 }}
                                        >
                                            -{lastResult.damage} HP
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="gameover"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="game-over"
                            >
                                <motion.div
                                    className="game-over-icon"
                                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                >
                                    {currentBand.icon}
                                </motion.div>
                                <h2 className="game-over-title">Assessment Complete</h2>
                                <div className="band-score" style={{ color: currentBand.color }}>
                                    {currentBand.band.replace('_', ' ').toUpperCase()}
                                </div>
                                <div className="band-label-large">{currentBand.label}</div>
                                <p className="game-over-text">
                                    {currentBand.description}<br />
                                    <span className="text-xs mt-2 block">Total Hesitation Damage: {totalDamage}</span>
                                </p>
                                <div className="game-over-actions">
                                    <motion.button
                                        className="share-button"
                                        onClick={shareScore}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        📤 Share Score
                                    </motion.button>
                                    <motion.button
                                        className="retry-button"
                                        onClick={resetGame}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        🔄 Practice Again
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Skill Domains */}
                <motion.div
                    className="skill-domains"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <h3 className="skills-title">Master All Four Domains</h3>
                    <div className="skills-grid">
                        {Object.entries(pedagogyManifest.skill_domains).map(([key, skill]) => (
                            <div
                                key={key}
                                className={`skill-card ${activeSkill === key ? 'active' : 'locked'}`}
                                style={{ borderColor: skill.color }}
                            >
                                <div className="skill-icon" style={{ fontSize: '2rem' }}>{skill.icon}</div>
                                <div className="skill-name" style={{ color: skill.color }}>
                                    {skill.stat_name}
                                </div>
                                <div className="skill-description">
                                    {skill.description}
                                </div>
                                {activeSkill !== key && (
                                    <div className="coming-soon">Coming Soon</div>
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Leaderboard / Hall of Fame */}
                <Leaderboard />

                {/* Instructions */}
                <motion.div
                    className="instructions"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <p>💡 Hold the button and speak clearly. Release when done.</p>
                    <p>⚠️ Pauses longer than 2 seconds will damage your Band score.</p>
                    <p>🎯 Achieve Band 7.0 or higher to pass!</p>
                </motion.div>
            </div>
        </div>
    )
}

export default App
