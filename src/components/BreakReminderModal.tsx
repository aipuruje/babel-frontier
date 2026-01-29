import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './BreakReminderModal.css';

interface BreakReminderModalProps {
    minutes: number;           // How long they've been focusing
    onTakeBreak: () => void;
    onContinue: () => void;
    onDismiss: () => void;
}

// BRAIN_FACTS are now moved to the i18n files

/**
 * BreakReminderModal Component
 * Appears after 20 or 40 minutes of focus to suggest breaks
 * Based on attention span research for teens/young adults
 */
export const BreakReminderModal: React.FC<BreakReminderModalProps> = ({
    minutes,
    onTakeBreak,
    onContinue,
    onDismiss
}) => {
    const { t } = useTranslation();
    const [breakTimeLeft, setBreakTimeLeft] = useState(0);
    const [isOnBreak, setIsOnBreak] = useState(false);

    // Get translated facts array
    const facts = t('breaks.facts', { returnObjects: true }) as string[];
    const [brainFact] = useState(() =>
        facts[Math.floor(Math.random() * facts.length)]
    );

    const suggestedBreakTime = minutes >= 40 ? 10 : 5; // 10 min after 40, 5 min after 20

    const handleBreakComplete = useCallback(() => {
        setIsOnBreak(false);
        onDismiss();
    }, [onDismiss]);

    useEffect(() => {
        if (isOnBreak && breakTimeLeft > 0) {
            const timer = setTimeout(() => {
                setBreakTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (isOnBreak && breakTimeLeft === 0) {
            handleBreakComplete();
        }
    }, [isOnBreak, breakTimeLeft, handleBreakComplete]);

    const handleTakeBreak = () => {
        setIsOnBreak(true);
        setBreakTimeLeft(suggestedBreakTime * 60);
        onTakeBreak();
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isOnBreak) {
        return (
            <div className="break-reminder-overlay">
                <div className="break-reminder-modal break-reminder-modal--break">
                    <div className="break-reminder-modal__header">
                        <h3 className="break-reminder-modal__title">
                            {t('breaks.onBreakTitle')}
                        </h3>
                    </div>

                    <div className="break-reminder-modal__content">
                        <div className="break-timer">
                            <div className="break-timer__circle">
                                <span className="break-timer__time">
                                    {formatTime(breakTimeLeft)}
                                </span>
                            </div>
                        </div>

                        <p className="break-reminder-modal__text">
                            {t('breaks.onBreakText')}
                        </p>

                        <div className="break-reminder-modal__tips">
                            <strong>{t('breaks.tipsTitle')}</strong>
                            <ul>
                                <li>{t('breaks.tipWalk')}</li>
                                <li>{t('breaks.tipWater')}</li>
                                <li>{t('breaks.tipLookAway')}</li>
                                <li>{t('breaks.tipStretch')}</li>
                            </ul>
                        </div>
                    </div>

                    <div className="break-reminder-modal__actions">
                        <button
                            className="btn btn--secondary"
                            onClick={handleBreakComplete}
                        >
                            {t('breaks.endBreak')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="break-reminder-overlay">
            <div className="break-reminder-modal">
                <div className="break-reminder-modal__header">
                    <div className="break-reminder-modal__badge">
                        {t('breaks.headerTime', { count: minutes })}
                    </div>
                    <h3 className="break-reminder-modal__title">
                        {t('breaks.title')}
                    </h3>
                    <button
                        className="break-reminder-modal__close"
                        onClick={onDismiss}
                        aria-label={t('common.close')}
                    >
                        ×
                    </button>
                </div>

                <div className="break-reminder-modal__content">
                    <p className="break-reminder-modal__text">
                        {t('breaks.contentFocus', { count: minutes })}
                        <br />
                        {t('breaks.contentResearch', { count: suggestedBreakTime })}
                    </p>

                    <div className="break-reminder-modal__fact">
                        <div className="break-reminder-modal__fact-icon">🧠</div>
                        <p><strong>{t('breaks.factTitle')}:</strong> {brainFact}</p>
                    </div>
                </div>

                <div className="break-reminder-modal__actions">
                    <button
                        className="btn btn--primary"
                        onClick={handleTakeBreak}
                    >
                        {t('breaks.takeBreak', { count: suggestedBreakTime })}
                    </button>
                    <button
                        className="btn btn--secondary"
                        onClick={onContinue}
                    >
                        {t('breaks.continueLearning')}
                    </button>
                </div>

                <p className="break-reminder-modal__footnote">
                    {t('breaks.footnote')}
                </p>
            </div>
        </div>
    );
};

export default BreakReminderModal;
