import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Lock, Zap, Crown } from 'lucide-react';
import { getUpgradePrompt } from '@/data/pricing';
import { triggerHaptic } from '@/utils/telegram';
import './UpgradePrompt.css';

interface UpgradePromptProps {
    context: 'module-locked' | 'battle-limit' | 'mock-test' | 'power-hour';
    onClose: () => void;
    onUpgrade: () => void;
}

/**
 * Upgrade Prompt Component - Strategic Paywall
 * Shows contextual upgrade messages at key friction points
 */
export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ context, onClose, onUpgrade }) => {
    const { t } = useTranslation();
    const prompt = getUpgradePrompt(context);

    const handleUpgrade = () => {
        triggerHaptic('success');
        onUpgrade();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="upgrade-prompt"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Close Button */}
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                {/* Icon */}
                <motion.div
                    className="upgrade-icon"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                >
                    <Lock size={64} />
                </motion.div>

                {/* Content */}
                <h2 className="upgrade-title">{t(prompt.title)}</h2>
                <p className="upgrade-message">{t(prompt.message)}</p>

                {/* Benefits List */}
                <div className="upgrade-benefits">
                    <div className="benefit-item">
                        <Zap size={20} className="benefit-icon" />
                        <span>{t('upgrade.benefitModules')}</span>
                    </div>
                    <div className="benefit-item">
                        <Crown size={20} className="benefit-icon" />
                        <span>{t('upgrade.benefitUnlimited')}</span>
                    </div>
                    <div className="benefit-item">
                        <Zap size={20} className="benefit-icon" />
                        <span>{t('upgrade.benefitAnalytics')}</span>
                    </div>
                </div>

                {/* CTA Button */}
                <button className="upgrade-cta" onClick={handleUpgrade}>
                    <Crown size={20} />
                    {t(prompt.cta)}
                </button>

                {/* Secondary Action */}
                <button className="upgrade-later" onClick={onClose}>
                    {t('common.maybeLater')}
                </button>
            </motion.div>
        </div>
    );
};

export default UpgradePrompt;
