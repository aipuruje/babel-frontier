import { useState, useEffect } from 'react';
import './OnboardingFlow.css';

export default function OnboardingFlow({ userId, onComplete }) {
    const [step, setStep] = useState('INIT');
    const [message, setMessage] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [isAuraTyping, setIsAuraTyping] = useState(false);

    useEffect(() => {
        progressFlow('INIT');
    }, []);

    const progressFlow = async (nextStep, data = {}) => {
        setIsAuraTyping(true);
        try {
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, step: nextStep, data })
            });
            const result = await res.json();

            if (result.success) {
                onComplete(result.momentum);
            } else {
                setMessage(result.message);
                setStep(result.nextStep);
            }
        } catch (err) {
            console.error("Onboarding flow error:", err);
        } finally {
            setIsAuraTyping(false);
        }
    };

    return (
        <div className="onboarding-overlay">
            <div className="aura-dialogue-vault">
                <div className="aura-avatar animate-float">🛰️</div>
                <div className="aura-bubble">
                    {isAuraTyping ? (
                        <div className="typing-indicator">Aura is projecting...</div>
                    ) : (
                        <p>{message}</p>
                    )}
                </div>

                <div className="interaction-zone animate-fade-in">
                    {step === 'SET_DATE' && (
                        <input
                            type="date"
                            onChange={(e) => setInputValue(e.target.value)}
                            onBlur={() => progressFlow('SET_DATE', { targetDate: inputValue })}
                        />
                    )}

                    {step === 'SUBMIT_DIAGNOSTIC' && (
                        <textarea
                            placeholder="Type your three sentences here..."
                            onChange={(e) => setInputValue(e.target.value)}
                            onBlur={() => progressFlow('SUBMIT_DIAGNOSTIC', { essay: inputValue })}
                            rows={4}
                        />
                    )}

                    <button
                        className="aura-confirm-btn"
                        onClick={() => progressFlow(step, step === 'SET_DATE' ? { targetDate: inputValue } : { essay: inputValue })}
                        disabled={isAuraTyping || !inputValue}
                    >
                        Confirm Flight Path
                    </button>
                </div>
            </div>
        </div>
    );
}
