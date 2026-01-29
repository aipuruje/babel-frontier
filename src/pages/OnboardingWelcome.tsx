import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Calendar, Zap, Award, ArrowRight } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { triggerHaptic } from '@/utils/telegram';
import './OnboardingWelcome.css';

/**
 * Onboarding Welcome Screen - Phase 1.3
 * Persona-based personalization to create "aha moment" within 2 minutes
 * Optimized for "Ambitious Amir" persona (goal-oriented, time-sensitive)
 */
export const OnboardingWelcome: React.FC = () => {
    const navigate = useNavigate();
    const { profile, setProfile } = useUserStore();

    const [step, setStep] = useState(1);
    const [persona, setPersona] = useState<string>('');
    const [targetBand, setTargetBand] = useState<number>(7.0);
    const [examDate, setExamDate] = useState<string>('');

    const TOTAL_STEPS = 3;

    // Persona options optimized for Central Asian IELTS learners
    const personaOptions = [
        {
            id: 'study_abroad',
            icon: '🎓',
            title: 'Study Abroad',
            description: 'University application',
            bandSuggestion: 7.0,
        },
        {
            id: 'immigration',
            icon: '✈️',
            title: 'Immigration',
            description: 'Visa requirements',
            bandSuggestion: 6.5,
        },
        {
            id: 'work',
            icon: '💼',
            title: 'Work',
            description: 'Professional registration',
            bandSuggestion: 7.0,
        },
        {
            id: 'personal',
            icon: '📚',
            title: 'Personal Growth',
            description: 'English proficiency',
            bandSuggestion: 6.0,
        },
    ];

    const bandOptions = [6.0, 6.5, 7.0, 7.5, 8.0, 8.5];

    const handlePersonaSelect = (id: string, suggestedBand: number) => {
        setPersona(id);
        setTargetBand(suggestedBand);
        triggerHaptic('selection');
        setTimeout(() => setStep(2), 300);
    };

    const handleBandSelect = (band: number) => {
        setTargetBand(band);
        triggerHaptic('selection');
    };

    const handleComplete = () => {
        if (!profile) return;

        // Save personalization data
        setProfile({
            ...profile,
            targetBand,
            examDate,
            hasCompletedSignup: true,
        });

        triggerHaptic('success');

        // Navigate to quick tutorial or dashboard
        navigate('/tutorial');
    };

    const renderStep1 = () => (
        <motion.div
            key="step1"
            className="onboarding-step"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
        >
            <div className="onboarding-header">
                <div className="onboarding-icon">👋</div>
                <h1 className="onboarding-title">
                    Welcome, {profile?.firstName || 'Student'}!
                </h1>
                <p className="onboarding-subtitle">
                    Let's personalize your IELTS journey in 30 seconds
                </p>
            </div>

            <div className="onboarding-question">
                <h3>Why are you preparing for IELTS?</h3>
            </div>

            <div className="persona-grid">
                {personaOptions.map((option) => (
                    <motion.button
                        key={option.id}
                        className={`persona-card ${persona === option.id ? 'selected' : ''}`}
                        onClick={() => handlePersonaSelect(option.id, option.bandSuggestion)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="persona-icon">{option.icon}</div>
                        <div className="persona-title">{option.title}</div>
                        <div className="persona-description">{option.description}</div>
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );

    const renderStep2 = () => (
        <motion.div
            key="step2"
            className="onboarding-step"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.4 }}
        >
            <div className="onboarding-header">
                <div className="onboarding-icon">
                    <Target size={48} />
                </div>
                <h1 className="onboarding-title">What's your target band score?</h1>
                <p className="onboarding-subtitle">
                    We'll customize your learning path to help you achieve it
                </p>
            </div>

            <div className="band-selector">
                {bandOptions.map((band) => (
                    <motion.button
                        key={band}
                        className={`band-option ${targetBand === band ? 'selected' : ''}`}
                        onClick={() => handleBandSelect(band)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <div className="band-value">{band}</div>
                        <div className="band-label">Band</div>
                    </motion.button>
                ))}
            </div>

            <div className="navigation-buttons">
                <button className="btn-secondary" onClick={() => setStep(1)}>
                    Back
                </button>
                <button className="btn-primary" onClick={() => setStep(3)}>
                    Next
                    <ArrowRight size={20} />
                </button>
            </div>
        </motion.div>
    );

    const renderStep3 = () => {
        const today = new Date().toISOString().split('T')[0];
        const threeMonths = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

        return (
            <motion.div
                key="step3"
                className="onboarding-step"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
            >
                <div className="onboarding-header">
                    <div className="onboarding-icon">
                        <Calendar size={48} />
                    </div>
                    <h1 className="onboarding-title">When's your IELTS exam?</h1>
                    <p className="onboarding-subtitle">
                        This helps us create the perfect study schedule
                    </p>
                </div>

                <div className="exam-date-section">
                    <input
                        type="date"
                        className="exam-date-input"
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        min={today}
                        max={threeMonths}
                    />

                    {examDate && (
                        <motion.div
                            className="urgency-message"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Zap size={20} />
                            <span>
                                {Math.ceil(
                                    (new Date(examDate).getTime() - new Date().getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}{' '}
                                days to achieve Band {targetBand}!
                            </span>
                        </motion.div>
                    )}

                    <button className="skip-date-btn" onClick={() => setExamDate('')}>
                        I'll set this later
                    </button>
                </div>

                <div className="navigation-buttons">
                    <button className="btn-secondary" onClick={() => setStep(2)}>
                        Back
                    </button>
                    <button
                        className="btn-primary btn-large"
                        onClick={handleComplete}
                        disabled={!examDate && !persona}
                    >
                        <Award size={20} />
                        Start My Journey
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="onboarding-container">
            {/* Progress bar */}
            <div className="onboarding-progress-bar">
                <div
                    className="onboarding-progress-fill"
                    style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                />
            </div>

            {/* Step indicator */}
            <div className="onboarding-step-indicator">
                Step {step} of {TOTAL_STEPS}
            </div>

            {/* Animated step content */}
            <AnimatePresence mode="wait">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </AnimatePresence>
        </div>
    );
};

export default OnboardingWelcome;
