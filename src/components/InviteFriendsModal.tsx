import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Users, Zap } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { generateTelegramShareLink, generateShareMessage, calculateReferralRewards } from '@/utils/referralCodes';
import { triggerHaptic } from '@/utils/telegram';
import './InviteFriendsModal.css';

interface InviteFriendsModalProps {
    onClose: () => void;
}

/**
 * Invite Friends Modal - Viral Referral System
 * Optimized for "Ambitious Amir" persona (Gen Z, mobile-first, Telegram-native)
 */
export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const { profile } = useUserStore();
    const [copied, setCopied] = useState(false);

    const handleCopyCode = useCallback(() => {
        if (typeof window !== 'undefined' && window.navigator?.clipboard && profile?.referralCode) {
            window.navigator.clipboard.writeText(profile.referralCode);
            setCopied(true);
            triggerHaptic('success');

            setTimeout(() => setCopied(false), 2000);
        }
    }, [profile?.referralCode]);

    if (!profile || !profile.referralCode) {
        return null;
    }

    const telegramLink = generateTelegramShareLink(profile.referralCode);
    const shareMessage = generateShareMessage(
        t,
        profile.referralCode,
        profile.currentBand >= 5.5 ? profile.currentBand : undefined
    );

    const { totalXP, milestoneRewards } = calculateReferralRewards(profile.referralCount || 0);

    const handleShareTelegram = () => {
        triggerHaptic('selection');

        // Telegram share URL with pre-filled message
        const encodedMessage = encodeURIComponent(shareMessage);
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(telegramLink)}&text=${encodedMessage}`;

        window.open(shareUrl, '_blank');
    };

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={onClose}>
                <motion.div
                    className="invite-friends-modal"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {/* Close Button */}
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>

                    {/* Header */}
                    <div className="invite-header">
                        <div className="invite-icon-large">
                            <Users size={48} />
                        </div>
                        <h2 className="invite-title">{t('invite.title')}</h2>
                        <p className="invite-subtitle">
                            {t('invite.subtitle')}
                        </p>
                    </div>

                    {/* Stats Display */}
                    <div className="invite-stats">
                        <div className="stat-box">
                            <div className="stat-icon">
                                <Users size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">{profile.referralCount || 0}</div>
                                <div className="stat-label">{t('profile.friendsInvited')}</div>
                            </div>
                        </div>
                        <div className="stat-box stat-box-xp">
                            <div className="stat-icon">
                                <Zap size={24} />
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">+{totalXP} XP</div>
                                <div className="stat-label">{t('invite.earnedXP')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Milestones */}
                    {milestoneRewards.length > 0 && (
                        <div className="invite-milestones">
                            <h3>{t('invite.achievementsTitle')}</h3>
                            <div className="milestone-badges">
                                {milestoneRewards.map((reward, idx) => (
                                    <span key={idx} className="milestone-badge">
                                        {t(reward)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Referral Code Display */}
                    <div className="referral-code-section">
                        <label className="code-label">{t('invite.yourCode')}</label>
                        <div className="code-box">
                            <span className="code-text">{profile.referralCode}</span>
                            <button
                                className={`copy-button ${copied ? 'copied' : ''}`}
                                onClick={handleCopyCode}
                            >
                                {copied ? <Check size={20} /> : <Copy size={20} />}
                                <span>{copied ? t('common.success') : t('common.copy')}</span>
                            </button>
                        </div>
                    </div>

                    {/* Share Button */}
                    <button
                        className="share-telegram-button"
                        onClick={handleShareTelegram}
                    >
                        <span className="telegram-icon">📱</span>
                        {t('invite.shareTelegram')}
                    </button>

                    {/* How it Works */}
                    <div className="how-it-works">
                        <h4>{t('invite.howItWorksTitle')}</h4>
                        <ul>
                            <li>{t('invite.step1')}</li>
                            <li>{t('invite.step2')}</li>
                            <li>{t('invite.step3')}</li>
                            <li>{t('invite.step4')}</li>
                        </ul>
                    </div>

                    {/* Milestone Progress (Next Goal) */}
                    {(profile.referralCount || 0) < 5 && (
                        <div className="next-milestone">
                            <p>
                                {t('invite.nextMilestone', {
                                    count: 5 - (profile.referralCount || 0),
                                    badge: t('milestones.builder')
                                })}
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InviteFriendsModal;
