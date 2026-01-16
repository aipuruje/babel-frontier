import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { triggerHaptic } from '@/utils/telegram';
import './Landing.css';

// Story phases for cinematic experience
const STORY_PHASES = [
    {
        id: 1,
        icon: '⏳',
        title: 'The Struggle',
        text: '60 minutes. 40 questions. 2,750 words.',
        subtext: 'The clock is your enemy.',
        theme: 'dark',
        duration: 3000
    },
    {
        id: 2,
        icon: '🎯',
        title: 'The Trap',
        text: 'True? False? Or Not Given?',
        subtext: 'Your intuition betrays you.',
        theme: 'danger',
        duration: 3000
    },
    {
        id: 3,
        icon: '🧠',
        title: 'The Science',
        text: 'It\'s not about reading.',
        subtext: 'It\'s about cognitive velocity.',
        theme: 'info',
        duration: 3000
    },
    {
        id: 4,
        icon: '🏆',
        title: 'The Solution',
        text: 'Train the 9 skills IELTS actually tests.',
        subtext: 'Master the system.',
        theme: 'success',
        duration: 3000
    },
    {
        id: 5,
        icon: '🚀',
        title: 'The Invitation',
        text: 'Your 14-Day Mastery Path Awaits',
        subtext: 'Are you ready?',
        theme: 'gradient',
        duration: 4000,
        isFinal: true
    }
];

export default function Landing() {
    const [currentPhase, setCurrentPhase] = useState(0);
    const [hasWatched, setHasWatched] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useUserStore();

    useEffect(() => {
        // Auto-advance through story phases
        if (currentPhase < STORY_PHASES.length - 1) {
            const timer = setTimeout(() => {
                triggerHaptic('light');
                setCurrentPhase((prev) => prev + 1);
            }, STORY_PHASES[currentPhase].duration);

            return () => clearTimeout(timer);
        } else {
            // Reached final phase
            setHasWatched(true);
        }
    }, [currentPhase]);

    const handleBegin = () => {
        triggerHaptic('success');

        // If already authenticated, go to dashboard
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            // Go to diagnostic test (to be created)
            navigate('/dashboard');
        }
    };

    const handleSkip = () => {
        setCurrentPhase(STORY_PHASES.length - 1);
        setHasWatched(true);
        triggerHaptic('selection');
    };

    const phase = STORY_PHASES[currentPhase];

    return (
        <div className={`landing-container landing-theme-${phase.theme}`}>
            {/* Skip button - only show before final phase */}
            {!phase.isFinal && (
                <motion.button
                    className="landing-skip"
                    onClick={handleSkip}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                >
                    Skip
                </motion.button>
            )}

            {/* Progress indicator */}
            <div className="landing-progress">
                {STORY_PHASES.map((_, index) => (
                    <div
                        key={index}
                        className={`landing-progress-dot ${index === currentPhase ? 'active' : ''} ${index < currentPhase ? 'completed' : ''
                            }`}
                    />
                ))}
            </div>

            {/* Animated content */}
            <div className="landing-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={phase.id}
                        className="landing-phase"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        {/* Icon */}
                        <motion.div
                            className="landing-icon"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                            transition={{ delay: 0.2, duration: 0.8 }}
                        >
                            {phase.icon}
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            className="landing-title"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {phase.title}
                        </motion.h2>

                        {/* Main text */}
                        <motion.p
                            className="landing-text"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                        >
                            {phase.text}
                        </motion.p>

                        {/* Subtext */}
                        <motion.p
                            className="landing-subtext"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            {phase.subtext}
                        </motion.p>

                        {/* CTA button - only on final phase */}
                        {phase.isFinal && hasWatched && (
                            <motion.button
                                className="landing-cta"
                                onClick={handleBegin}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                    opacity: 1,
                                    scale: 1,
                                    boxShadow: [
                                        '0 0 0px rgba(102, 126, 234, 0.5)',
                                        '0 0 20px rgba(102, 126, 234, 0.8)',
                                        '0 0 0px rgba(102, 126, 234, 0.5)'
                                    ]
                                }}
                                transition={{
                                    opacity: { delay: 1, duration: 0.4 },
                                    scale: { delay: 1, duration: 0.4 },
                                    boxShadow: { delay: 1.5, duration: 2, repeat: Infinity }
                                }}
                            >
                                Begin Your Mastery
                            </motion.button>
                        )}

                        {/* Replay link - only on final phase after watching */}
                        {phase.isFinal && hasWatched && (
                            <motion.button
                                className="landing-replay"
                                onClick={() => {
                                    setCurrentPhase(0);
                                    setHasWatched(false);
                                    triggerHaptic('selection');
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.2 }}
                            >
                                ↺ Replay Story
                            </motion.button>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Background gradient animation */}
            <div className="landing-bg-gradient" />
        </div>
    );
}
