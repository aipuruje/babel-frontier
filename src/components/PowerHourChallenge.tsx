import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { Zap, Trophy, Clock, Pause, Play, X } from 'lucide-react';
import './PowerHourChallenge.css';

type SegmentType = 'work' | 'break';

interface Segment {
    type: SegmentType;
    duration: number; // minutes
    label: string;
}

const POWER_HOUR_SEGMENTS: Segment[] = [
    { type: 'work', duration: 20, label: 'Focus Session 1' },
    { type: 'break', duration: 5, label: 'Break 1' },
    { type: 'work', duration: 20, label: 'Focus Session 2' },
    { type: 'break', duration: 5, label: 'Break 2' },
    { type: 'work', duration: 20, label: 'Focus Session 3' },
];

const TOTAL_DURATION = POWER_HOUR_SEGMENTS.reduce((sum, seg) => sum + seg.duration, 0);
const XP_MULTIPLIER = 1.5;

/**
 * PowerHourChallenge Component
 * Structured 60-minute study session with automatic break intervals
 * Pattern: 20 work - 5 break - 20 work - 5 break - 20 work
 */
export const PowerHourChallenge: React.FC = () => {
    const navigate = useNavigate();
    const { updateXP, focusStats } = useUserStore();

    const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(POWER_HOUR_SEGMENTS[0].duration * 60); // seconds
    const [isPaused, setIsPaused] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const currentSegment = POWER_HOUR_SEGMENTS[currentSegmentIndex];
    const progress = ((POWER_HOUR_SEGMENTS.slice(0, currentSegmentIndex).reduce((sum, seg) => sum + seg.duration, 0) +
        (currentSegment.duration * 60 - timeLeft) / 60) / TOTAL_DURATION) * 100;

    const handleCompletion = useCallback(() => {
        // Award bonus XP for completing Power Hour
        const bonusXP = Math.floor(300 * XP_MULTIPLIER); // 300 base XP * 1.5 = 450 XP
        updateXP(bonusXP);
    }, [updateXP]);

    useEffect(() => {
        if (isPaused || isCompleted) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Move to next segment
                    if (currentSegmentIndex < POWER_HOUR_SEGMENTS.length - 1) {
                        setCurrentSegmentIndex((i) => i + 1);
                        return POWER_HOUR_SEGMENTS[currentSegmentIndex + 1].duration * 60;
                    } else {
                        // Power Hour completed!
                        setIsCompleted(true);
                        handleCompletion();
                        return 0;
                    }
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPaused, isCompleted, currentSegmentIndex, handleCompletion]);

    const handlePause = () => {
        setIsPaused(!isPaused);
    };

    const handleExit = () => {
        if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
            navigate('/dashboard');
        }
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isCompleted) {
        return (
            <div className="power-hour-container">
                <motion.div
                    className="power-hour-completion"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                >
                    <div className="completion-icon">🎉</div>
                    <h1>Power Hour Complete!</h1>
                    <p className="completion-message">
                        Congratulations! You've completed a full 60-minute structured study session.
                    </p>

                    <div className="completion-stats">
                        <div className="stat-item stat-item-xp">
                            <Trophy size={32} />
                            <div>
                                <div className="stat-value">+{Math.floor(300 * XP_MULTIPLIER)} XP</div>
                                <div className="stat-label">{XP_MULTIPLIER}x Bonus Applied!</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <Clock size={32} />
                            <div>
                                <div className="stat-value">60 minutes</div>
                                <div className="stat-label">Deep Focus Time</div>
                            </div>
                        </div>
                        <div className="stat-item">
                            <Zap size={32} />
                            <div>
                                <div className="stat-value">{focusStats.powerHoursCompleted + 1}</div>
                                <div className="stat-label">Power Hours Total</div>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary btn-large"
                        onClick={() => navigate('/dashboard')}
                    >
                        Back to Dashboard
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="power-hour-container">
            <div className="power-hour-header">
                <button className="exit-button" onClick={handleExit}>
                    <X size={20} />
                </button>
                <h1 className="power-hour-title">
                    <Zap size={24} />
                    Power Hour Challenge
                </h1>
                <div className="power-hour-subtitle">
                    Structured 60-min session • {XP_MULTIPLIER}x XP multiplier
                </div>
            </div>

            {/* Progress Timeline */}
            <div className="power-hour-timeline">
                {POWER_HOUR_SEGMENTS.map((segment, index) => (
                    <div
                        key={index}
                        className={`timeline-segment ${segment.type} ${index === currentSegmentIndex ? 'active' : ''
                            } ${index < currentSegmentIndex ? 'completed' : ''}`}
                    >
                        <div className="segment-label">{segment.label}</div>
                        <div className="segment-duration">{segment.duration}m</div>
                    </div>
                ))}
            </div>

            {/* Progress Bar */}
            <div className="power-hour-progress">
                <div className="progress-bar">
                    <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <div className="progress-text">{Math.floor(progress)}% Complete</div>
            </div>

            {/* Current Segment Display */}
            <div className={`current-segment current-segment-${currentSegment.type}`}>
                <div className="segment-type">
                    {currentSegment.type === 'work' ? '💪 Focus Time' : '☕ Break Time'}
                </div>
                <div className="segment-timer">{formatTime(timeLeft)}</div>
                <div className="segment-label">{currentSegment.label}</div>
            </div>

            {/* Controls */}
            <div className="power-hour-controls">
                <button
                    className="control-button"
                    onClick={handlePause}
                >
                    {isPaused ? <Play size={32} /> : <Pause size={32} />}
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
            </div>

            {/* Tips */}
            <div className="power-hour-tips">
                <h3>Tips for Success:</h3>
                <ul>
                    <li>🎧 Use headphones to block distractions during work segments</li>
                    <li>💧 Keep water nearby to stay hydrated</li>
                    <li>🚶 Use break time to stand, stretch, or walk around</li>
                    <li>📱 Put your phone on Do Not Disturb mode</li>
                </ul>
            </div>
        </div>
    );
};

export default PowerHourChallenge;
