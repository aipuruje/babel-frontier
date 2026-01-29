import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/store/userStore';
import { validateUzbekPhone, validateEmail, formatUzbekPhone, getValidationError } from '@/utils/validation';
import { getTelegramUser, triggerHaptic } from '@/utils/telegram';
import { registerUser } from '@/utils/api';
import { Phone, Mail, CheckCircle } from 'lucide-react';
import './SignUpModal.css';


interface SignUpModalProps {
    onComplete: () => void;
}

export default function SignUpModal({ onComplete }: SignUpModalProps) {
    const { t } = useTranslation();
    const completeSignup = useUserStore((state) => state.completeSignup);
    const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');
    const [phoneValue, setPhoneValue] = useState('+998 ');
    const [emailValue, setEmailValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const currentValue = activeTab === 'phone' ? phoneValue : emailValue;
    const isValid = activeTab === 'phone'
        ? validateUzbekPhone(phoneValue)
        : validateEmail(emailValue);

    const handleTabSwitch = (tab: 'phone' | 'email') => {
        triggerHaptic('selection');
        setActiveTab(tab);
        setError(null);
    };

    const handlePhoneChange = (e: any) => {
        const formatted = formatUzbekPhone(e.target.value);
        setPhoneValue(formatted);
        setError(null);
    };

    const handleEmailChange = (e: any) => {
        setEmailValue(e.target.value);
        setError(null);
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        const validationError = getValidationError(activeTab, currentValue);
        if (validationError) {
            setError(validationError);
            triggerHaptic('error');
            return;
        }

        setIsSubmitting(true);
        triggerHaptic('success');

        try {
            // Get Telegram user data
            const telegramUser = getTelegramUser();
            if (!telegramUser) {
                throw new Error('Unable to get user data');
            }

            console.log('📤 Registering user with backend...');

            // Call backend API to register user
            const response = await registerUser({
                telegramId: telegramUser.id,
                username: telegramUser.username,
                firstName: telegramUser.first_name,
                authMethod: activeTab,
                phoneNumber: activeTab === 'phone' ? currentValue : undefined,
                email: activeTab === 'email' ? currentValue : undefined
            });

            if (!response.success) {
                throw new Error(response.error || 'Registration failed');
            }

            console.log('✅ User registered in backend:', response.data);

            // Save to local store
            completeSignup(activeTab, currentValue);

            // Show success animation
            setShowSuccess(true);

            // Complete after animation
            setTimeout(() => {
                onComplete();
            }, 1200);
        } catch (err) {
            console.error('❌ Registration error:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect to server');
            triggerHaptic('error');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="signup-overlay">
            <div className={`signup-modal ${showSuccess ? 'success' : ''}`}>
                {showSuccess ? (
                    <div className="signup-success">
                        <div className="success-icon">
                            <CheckCircle size={64} />
                        </div>
                        <h2>{t('auth.signUpSuccessTitle')}</h2>
                        <p>{t('auth.signUpSuccessSubtitle')}</p>
                    </div>
                ) : (
                    <>
                        <div className="signup-accent-bar" />

                        <div className="signup-header">
                            <div className="signup-icon">🎓</div>
                            <h1>{t('auth.welcome')}</h1>
                            <p>{t('auth.description')}</p>
                        </div>

                        <div className="signup-tabs">
                            <button
                                type="button"
                                className={`signup-tab ${activeTab === 'phone' ? 'active' : ''}`}
                                onClick={() => handleTabSwitch('phone')}
                            >
                                <Phone size={18} />
                                {t('auth.phone')}
                            </button>
                            <button
                                type="button"
                                className={`signup-tab ${activeTab === 'email' ? 'active' : ''}`}
                                onClick={() => handleTabSwitch('email')}
                            >
                                <Mail size={18} />
                                {t('auth.email')}
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="signup-form">
                            <div className="signup-input-group">
                                {activeTab === 'phone' ? (
                                    <>
                                        <Phone className="input-icon" size={20} />
                                        <input
                                            type="tel"
                                            value={phoneValue}
                                            onChange={handlePhoneChange}
                                            placeholder={t('auth.enterPhone')}
                                            className={`signup-input ${error ? 'error' : ''}`}
                                            autoFocus
                                            maxLength={17}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <Mail className="input-icon" size={20} />
                                        <input
                                            type="email"
                                            value={emailValue}
                                            onChange={handleEmailChange}
                                            placeholder={t('auth.enterEmail')}
                                            className={`signup-input ${error ? 'error' : ''}`}
                                            autoFocus
                                        />
                                    </>
                                )}
                            </div>

                            {error && (
                                <div className="signup-error">
                                    {t(error)}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="signup-button"
                                disabled={!isValid || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <span className="button-spinner" />
                                ) : (
                                    t('common.continue')
                                )}
                            </button>
                        </form>

                        <p className="signup-privacy">
                            {t('auth.privacy')}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
