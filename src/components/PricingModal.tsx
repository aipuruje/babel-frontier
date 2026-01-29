import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Crown, Sparkles } from 'lucide-react';
import { PRICING_PLANS, calculateLifetimeSavings, type PricingTier } from '@/data/pricing';
import { triggerHaptic } from '@/utils/telegram';
import { purchaseWithTelegramStars, purchaseWithClick, purchaseWithPayme } from '@/services/payment';
import './PricingModal.css';

interface PricingModalProps {
    onClose: () => void;
    currentTier?: PricingTier;
    highlightTier?: PricingTier; // Which tier to highlight/recommend
}

/**
 * Pricing Modal Component - Phase 2.1
 * Optimized for "Ambitious Amir" persona with psychology-driven pricing
 */
export const PricingModal: React.FC<PricingModalProps> = ({
    onClose,
    currentTier = 'free',
    highlightTier = 'lifetime'
}) => {
    const { t } = useTranslation();
    const [selectedTier, setSelectedTier] = useState<PricingTier>(highlightTier);
    const [paymentMethod] = useState<'telegram-stars' | 'click' | 'payme'>('telegram-stars');
    const lifetimeSavings = calculateLifetimeSavings();

    const handleSelectPlan = (tier: PricingTier) => {
        setSelectedTier(tier);
        triggerHaptic('selection');
    };

    const handleUpgrade = async () => {
        triggerHaptic('success');

        if (selectedTier === 'free') {
            onClose();
            return;
        }

        if (selectedTier !== 'premium' && selectedTier !== 'lifetime') {
            return;
        }

        // Process payment based on selected method
        let result;
        if (paymentMethod === 'telegram-stars') {
            result = await purchaseWithTelegramStars(selectedTier);
        } else if (paymentMethod === 'click') {
            result = await purchaseWithClick(selectedTier);
        } else if (paymentMethod === 'payme') {
            result = await purchaseWithPayme(selectedTier);
        }

        if (result?.success) {
            console.log('Payment initiated:', result);
            // Payment processing will continue in Telegram or external gateway
        } else {
            alert(t('common.error') + ': ' + (result?.error || t('common.error')));
        }
    };

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose}>
                <motion.div
                    className="pricing-modal"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ scale: 0.9, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 50 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {/* Close Button */}
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>

                    {/* Header */}
                    <div className="pricing-header">
                        <motion.div
                            className="pricing-header-icon"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: 'spring' }}
                        >
                            <Crown size={48} />
                        </motion.div>
                        <h2 className="pricing-title">{t('pricing.chooseYourPlan')}</h2>
                        <p className="pricing-subtitle">
                            {t('pricing.unlockPotential')}
                        </p>
                    </div>

                    {/* Pricing Cards Grid */}
                    <div className="pricing-grid">
                        {PRICING_PLANS.map((plan, index) => {
                            const isSelected = selectedTier === plan.id;
                            const isCurrent = currentTier === plan.id;
                            const isRecommended = highlightTier === plan.id;

                            return (
                                <motion.div
                                    key={plan.id}
                                    className={`pricing-card ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''} ${isRecommended ? 'recommended' : ''}`}
                                    onClick={() => handleSelectPlan(plan.id)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {/* Badge */}
                                    {plan.badge && (
                                        <div className="pricing-badge" style={{ background: plan.color }}>
                                            {t(plan.badge)}
                                        </div>
                                    )}

                                    {/* Current Plan Indicator */}
                                    {isCurrent && (
                                        <div className="current-plan-indicator">
                                            <Check size={16} />
                                            {t('pricing.currentPlan')}
                                        </div>
                                    )}

                                    {/* Plan Header */}
                                    <div className="pricing-card-header">
                                        <h3 className="plan-name">{t(plan.name)}</h3>
                                        <div className="plan-price">
                                            {plan.originalPrice && (
                                                <span className="original-price">
                                                    ${plan.originalPrice}
                                                </span>
                                            )}
                                            <span className="price-amount">
                                                {plan.price === 0 ? t('pricing.free') : `$${plan.price}`}
                                            </span>
                                            {plan.billingPeriod !== 'free' && (
                                                <span className="billing-period">
                                                    /{plan.billingPeriod === 'monthly' ? t('pricing.perMonth') : t('pricing.forever')}
                                                </span>
                                            )}
                                        </div>

                                        {/* Savings Badge for Lifetime */}
                                        {plan.id === 'lifetime' && (
                                            <div className="savings-badge">
                                                <Sparkles size={14} />
                                                {t('pricing.save', {
                                                    amount: lifetimeSavings.totalSavings,
                                                    percent: lifetimeSavings.percentageDiscount
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Features List */}
                                    <ul className="features-list">
                                        {plan.features.map((feature, idx) => {
                                            const rawCount =
                                                feature === 'pricing.features.accessModules' ? plan.limits.modulesAccess :
                                                    feature === 'pricing.features.battleModeDaily' ? plan.limits.battleModeDailyLimit : undefined;

                                            // i18next count must be a number or undefined
                                            const count = typeof rawCount === 'number' ? rawCount : undefined;

                                            return (
                                                <li key={idx} className="feature-item">
                                                    <Check size={16} className="feature-check" />
                                                    <span>{t(feature, { count })}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    {/* Select Button */}
                                    {!isCurrent && (
                                        <button
                                            className={`select-plan-btn ${isSelected ? 'selected' : ''}`}
                                            style={{
                                                background: isSelected ? plan.color : 'transparent',
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSelectPlan(plan.id);
                                            }}
                                        >
                                            {isSelected ? (
                                                <>
                                                    <Check size={18} />
                                                    {t('pricing.selected')}
                                                </>
                                            ) : (
                                                t('pricing.selectPlan')
                                            )}
                                        </button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Lifetime Value Proposition */}
                    {selectedTier === 'lifetime' && (
                        <motion.div
                            className="value-proposition"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Zap size={20} />
                            <span>
                                <strong>{t('pricing.smartChoiceTitle', { defaultValue: 'Smart Choice!' })}</strong> {t('pricing.smartChoice', { months: lifetimeSavings.monthsToBreakEven })}
                            </span>
                        </motion.div>
                    )}

                    {/* CTA Button */}
                    <motion.button
                        className="pricing-cta"
                        onClick={handleUpgrade}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {selectedTier === 'free' ? (
                            t('pricing.continueWithFree')
                        ) : currentTier === selectedTier ? (
                            t('pricing.youHaveThisPlan')
                        ) : (
                            <>
                                <Crown size={20} />
                                {t('pricing.upgradeTo', { plan: t(PRICING_PLANS.find(p => p.id === selectedTier)?.name || '') })}
                            </>
                        )}
                    </motion.button>

                    {/* Footer */}
                    <div className="pricing-footer">
                        <p>{t('pricing.securePayment')}</p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PricingModal;
