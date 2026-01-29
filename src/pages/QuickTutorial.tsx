import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Clock, Trophy, ArrowRight, Check } from 'lucide-react';
import { triggerHaptic } from '@/utils/telegram';
import './QuickTutorial.css';

/**
 * Quick Tutorial - 30-Second Battle Mode Introduction
 * Creates "aha moment" by showing the value proposition immediately
 * Optimized for Gen Z attention span (76 seconds)
 */
export const QuickTutorial: React.FC = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);

    const tutorialSteps = [
        {
            icon: <Zap size={64} />,
            title: 'Welcome to Battle Mode',
            description: 'The fastest way to master IELTS Reading',
            detail: 'Short, focused challenges designed for your busy schedule.',
            color: '#667eea',
        },
        {
            icon: <Clock size={64} />,
            title: 'Race Against Time',
            description: '60-second challenges that mirror real IELTS pressure',
            detail: 'Train your brain to process information faster.',
            color: '#f59e0b',
        },
        {
            icon: <Trophy size={64} />,
            title: 'Earn XP & Level Up',
            description: 'Every correct answer = progress toward your goal',
            detail: 'Track your band score prediction in real-time.',
            color: '#22c55e',
        },
    ];

    const currentTutorialStep = tutorialSteps[currentStep];
    const isLastStep = currentStep === tutorialSteps.length - 1;

    const handleNext = () => {
        triggerHaptic('light');
        if (isLastStep) {
            navigate('/dashboard');
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleSkip = () => {
        triggerHaptic('selection');
        navigate('/dashboard');
    };

    return (
        <div className="tutorial-container">
            {/* Skip button */}
            <button className="tutorial-skip" onClick={handleSkip}>
                Skip Tutorial
            </button>

            {/* Progress dots */}
            <div className="tutorial-progress">
                {tutorialSteps.map((_, index) => (
                    <div
                        key={index}
                        className={`tutorial-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''
                            }`}
                    />
                ))}
            </div>

            {/* Animated content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    className="tutorial-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                >
                    <motion.div
                        className="tutorial-icon"
                        style={{ color: currentTutorialStep.color }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        {currentTutorialStep.icon}
                    </motion.div>

                    <h1 className="tutorial-title">{currentTutorialStep.title}</h1>
                    <p className="tutorial-description">{currentTutorialStep.description}</p>
                    <p className="tutorial-detail">{currentTutorialStep.detail}</p>

                    {/* Visual Example (for first step) */}
                    {currentStep === 0 && (
                        <motion.div
                            className="tutorial-example"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="example-card">
                                <div className="example-header">
                                    <span className="example-badge">Battle Mode</span>
                                    <span className="example-timer">⏱️ 60s</span>
                                </div>
                                <div className="example-question">
                                    <strong>Q:</strong> The passage states that climate change is...
                                </div>
                                <div className="example-options">
                                    <div className="example-option">A. True</div>
                                    <div className="example-option">B. False</div>
                                    <div className="example-option">C. Not Given</div>
                                </div>
                                <div className="example-footer">
                                    <span className="example-xp">+20 XP</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Benefits List (for second step) */}
                    {currentStep === 1 && (
                        <motion.div
                            className="tutorial-benefits"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {[
                                'Build reading speed',
                                'Improve time management',
                                'Reduce exam anxiety',
                            ].map((benefit, idx) => (
                                <motion.div
                                    key={idx}
                                    className="benefit-item"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                >
                                    <Check size={20} />
                                    <span>{benefit}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* CTA Button */}
                    <motion.button
                        className="tutorial-cta"
                        onClick={handleNext}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {isLastStep ? (
                            <>
                                <Trophy size={20} />
                                Start Learning
                            </>
                        ) : (
                            <>
                                Next
                                <ArrowRight size={20} />
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default QuickTutorial;
