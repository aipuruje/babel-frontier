import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
    error?: Error;
    resetError?: () => void;
}

/**
 * ErrorFallback Component
 * User-friendly error display with recovery options
 */
export default function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/dashboard');
        resetError?.();
    };

    const handleReload = () => {
        window.location.reload();
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    maxWidth: '500px',
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    padding: '40px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    textAlign: 'center',
                }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 24px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <AlertTriangle size={40} color="#fff" />
                </motion.div>

                <h2 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#fff',
                    marginBottom: '12px',
                }}>
                    {t('errors.somethingWentWrong', 'Something Went Wrong')}
                </h2>

                <p style={{
                    fontSize: '16px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '32px',
                    lineHeight: '1.6',
                }}>
                    {t('errors.errorMessage', "We've encountered an unexpected error. Don't worry, your progress is saved. Try refreshing the page or going back to the dashboard.")}
                </p>

                {import.meta.env.DEV && error && (
                    <details style={{
                        marginBottom: '32px',
                        textAlign: 'left',
                        background: 'rgba(0, 0, 0, 0.3)',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                        <summary style={{
                            cursor: 'pointer',
                            color: '#f59e0b',
                            fontWeight: '600',
                            marginBottom: '12px',
                        }}>
                            🔍 {t('errors.technicalDetails', 'Technical Details')} (Dev Mode)
                        </summary>
                        <pre style={{
                            overflow: 'auto',
                            fontSize: '12px',
                            color: '#ff6b6b',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                        }}>
                            {error.toString()}
                            {error.stack && `\n\n${error.stack}`}
                        </pre>
                    </details>
                )}

                <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexDirection: 'column',
                }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleReload}
                        style={{
                            padding: '14px 24px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        <RefreshCw size={20} />
                        {t('errors.reloadPage', 'Reload Page')}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGoHome}
                        style={{
                            padding: '14px 24px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                        }}
                    >
                        <Home size={20} />
                        {t('errors.goToDashboard', 'Go to Dashboard')}
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
