import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { triggerHaptic } from '@/utils/telegram';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import SuccessMetricsBadge from '@/components/SuccessMetricsBadge';
import { getRandomTestimonials } from '@/data/testimonials';
import './Landing.css';

export default function Landing() {
    const { t } = useTranslation();
    const [currentPhase, setCurrentPhase] = useState(0);
    const [hasWatched, setHasWatched] = useState(false);
    const navigate = useNavigate();
    const { isAuthenticated } = useUserStore();

    const storyPhases = useMemo(() => [
        {
            id: 1,
            icon: '⏳',
            title: t('landing.story.phase1.title'),
            text: t('landing.story.phase1.text'),
            subtext: t('landing.story.phase1.subtext'),
            theme: 'dark',
            duration: 3000
        },
        {
            id: 2,
            icon: '🎯',
            title: t('landing.story.phase2.title'),
            text: t('landing.story.phase2.text'),
            subtext: t('landing.story.phase2.subtext'),
            theme: 'danger',
            duration: 3000
        },
        {
            id: 3,
            icon: '🧠',
            title: t('landing.story.phase3.title'),
            text: t('landing.story.phase3.text'),
            subtext: t('landing.story.phase3.subtext'),
            theme: 'info',
            duration: 3000
        },
        {
            id: 4,
            icon: '🏆',
            title: t('landing.story.phase4.title'),
            text: t('landing.story.phase4.text'),
            subtext: t('landing.story.phase4.subtext'),
            theme: 'success',
            duration: 3000
        },
        {
            id: 5,
            icon: '🚀',
            title: t('landing.story.phase5.title'),
            text: t('landing.story.phase5.text'),
            subtext: t('landing.story.phase5.subtext'),
            theme: 'gradient',
            duration: 4000,
            isFinal: true
        }
    ], [t]);

    useEffect(() => {
        // Auto-advance through story phases
        if (currentPhase < storyPhases.length - 1) {
            const timer = setTimeout(() => {
                triggerHaptic('light');
                setCurrentPhase((prev) => prev + 1);
            }, storyPhases[currentPhase].duration);

            return () => clearTimeout(timer);
        } else {
            // Reached final phase
            setHasWatched(true);
        }
    }, [currentPhase, storyPhases]);

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
        setCurrentPhase(storyPhases.length - 1);
        setHasWatched(true);
        triggerHaptic('selection');
    };

    const phase = storyPhases[currentPhase];
    const testimonials = getRandomTestimonials(5); // Get 5 random testimonials

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
                    {t('landing.skip')}
                </motion.button>
            )}

            {/* Progress indicator */}
            <div className="landing-progress">
                {storyPhases.map((_, index) => (
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
                                {t('landing.begin')}
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
                                {t('landing.replay')}
                            </motion.button>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Social Proof Section - Show on final phase after watching */}
            {phase.isFinal && hasWatched && (
                <motion.div
                    className="landing-social-proof"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5, duration: 0.8 }}
                >
                    {/* Success Metrics Badge */}
                    <SuccessMetricsBadge variant="compact" />

                    {/* Testimonials Carousel */}
                    <div className="landing-testimonials-section">
                        <h2 className="section-title">{t('landing.testimonialsTitle')}</h2>
                        <TestimonialsCarousel testimonials={testimonials} autoPlay interval={6000} />
                    </div>
                </motion.div>
            )}

            {/* Background gradient animation */}
            <div className="landing-bg-gradient" />
        </div>
    );
}
