import React from 'react';
import { motion } from 'framer-motion';
import { X, Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { ShareableAchievement, generateTelegramShareURL } from '@/utils/achievementSharing';
import { triggerHaptic } from '@/utils/telegram';
import './ShareAchievement.css';

interface ShareAchievementProps {
    achievement: ShareableAchievement;
    referralCode: string;
    onClose: () => void;
}

/**
 * Share Achievement Modal - Phase 3 Telegram Growth
 * Viral sharing component for posting achievements to Telegram
 */
export const ShareAchievement: React.FC<ShareAchievementProps> = ({
    achievement,
    referralCode,
    onClose,
}) => {
    const [copied, setCopied] = useState(false);
    const shareURL = generateTelegramShareURL(achievement, referralCode);

    const handleShareTelegram = () => {
        triggerHaptic('success');
        window.open(shareURL, '_blank');
    };

    const handleCopyLink = () => {
        const link = `https://t.me/ielts_rater_bot?start=${referralCode}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        triggerHaptic('success');

        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="share-achievement-modal"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {/* Close Button */}
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                {/* Achievement Card */}
                <motion.div
                    className="achievement-card"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="achievement-icon-large">{achievement.icon}</div>
                    <h2 className="achievement-title">{achievement.title}</h2>
                    <p className="achievement-description">{achievement.description}</p>

                    {/* Stats Grid */}
                    {achievement.stats && achievement.stats.length > 0 && (
                        <div className="achievement-stats-grid">
                            {achievement.stats.map((stat, idx) => (
                                <div key={idx} className="achievement-stat-item">
                                    <div className="stat-value">{stat.value}</div>
                                    <div className="stat-label">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Share Section */}
                <div className="share-section">
                    <h3 className="share-title">Share Your Success!</h3>
                    <p className="share-subtitle">
                        Inspire your friends and earn +100 XP for each referral
                    </p>

                    {/* Action Buttons */}
                    <div className="share-actions">
                        <button
                            className="share-telegram-btn"
                            onClick={handleShareTelegram}
                        >
                            <Share2 size={20} />
                            Share on Telegram
                        </button>

                        <button
                            className={`copy-link-btn ${copied ? 'copied' : ''}`}
                            onClick={handleCopyLink}
                        >
                            {copied ? <Check size={20} /> : <Copy size={20} />}
                            {copied ? 'Link Copied!' : 'Copy Referral Link'}
                        </button>
                    </div>
                </div>

                {/* Skip Option */}
                <button className="share-skip-btn" onClick={onClose}>
                    Skip for Now
                </button>
            </motion.div>
        </div>
    );
};

export default ShareAchievement;
