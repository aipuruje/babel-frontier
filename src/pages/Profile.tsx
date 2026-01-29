import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore, useCurrentLevel, useStreakDays, useCurrentBand } from '@/store/userStore';
import { useSubmissionStore } from '@/store/submissionStore';
import { User, Award, Settings, AlertTriangle, Calendar, Users } from 'lucide-react';
import { triggerHaptic } from '@/utils/telegram';
import InviteFriendsModal from '@/components/InviteFriendsModal';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import './Profile.css';

export default function Profile() {
    const { t, i18n } = useTranslation();
    const { profile, setProfile } = useUserStore();
    const level = useCurrentLevel();
    const streakDays = useStreakDays();
    const currentBand = useCurrentBand();
    const { getTotalQuestions, clearSubmissions } = useSubmissionStore();

    const [targetBand, setTargetBand] = useState(profile?.targetBand || 7.0);
    const [showInviteModal, setShowInviteModal] = useState(false);

    const totalQuestions = getTotalQuestions();

    const handleTargetBandChange = (value: number) => {
        if (value >= 4.0 && value <= 9.0) {
            setTargetBand(value);
            if (profile) {
                setProfile({
                    ...profile,
                    targetBand: value
                });
                triggerHaptic('success');
            }
        }
    };

    const handleClearProgress = () => {
        if (window.confirm(t('profile.clearConfirm'))) {
            triggerHaptic('error');
            clearSubmissions();
            // Don't clear profile data, only submissions
            alert(t('profile.progressCleared'));
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return t('profile.unknown');
        const date = new Date(dateString);
        return date.toLocaleDateString(i18n.language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="profile-container">
            {/* Profile Header */}
            <div className="profile-header">
                <div className="profile-avatar">
                    {profile ? getInitials(profile.firstName) : '?'}
                </div>
                <h1 className="profile-name">{profile?.firstName || t('profile.user')}</h1>
                <p className="profile-username">@{profile?.username || t('profile.unknown').toLowerCase()}</p>

                <div className="profile-stats-row">
                    <div className="profile-stat">
                        <div className="profile-stat-value">{level}</div>
                        <div className="profile-stat-label">{t('profile.level')}</div>
                    </div>
                    <div className="profile-stat">
                        <div className="profile-stat-value">{streakDays}</div>
                        <div className="profile-stat-label">{t('dashboard.dayStreak')}</div>
                    </div>
                    <div className="profile-stat">
                        <div className="profile-stat-value">{currentBand || '—'}</div>
                        <div className="profile-stat-label">{t('dashboard.currentBand')}</div>
                    </div>
                </div>
            </div>

            {/* Progress Summary */}
            <div className="profile-section">
                <h3 className="profile-section-title">
                    <Award size={20} />
                    {t('profile.progressSummary')}
                </h3>
                <div className="profile-info-grid">
                    <div className="profile-info-item">
                        <span className="profile-info-label">{t('profile.totalXP')}</span>
                        <span className="profile-info-value">{profile?.xp || 0} XP</span>
                    </div>
                    <div className="profile-info-item">
                        <span className="profile-info-label">{t('profile.questionsCompleted')}</span>
                        <span className="profile-info-value">{totalQuestions}</span>
                    </div>
                    <div className="profile-info-item">
                        <span className="profile-info-label">{t('profile.currentStreak')}</span>
                        <span className="profile-info-value">{streakDays} {t('common.days', { count: streakDays })}</span>
                    </div>
                    <div className="profile-info-item">
                        <span className="profile-info-label">{t('profile.lastActive')}</span>
                        <span className="profile-info-value">
                            {profile?.lastActive ? formatDate(profile.lastActive) : t('profile.never')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Invite Friends Section */}
            <div className="profile-section invite-section">
                <h3 className="profile-section-title">
                    <Users size={20} />
                    {t('profile.inviteFriends')}
                </h3>
                <p className="section-description">
                    {t('profile.inviteDescription')}
                </p>
                <div className="referral-stats-preview">
                    <div className="referral-stat-item">
                        <span className="referral-stat-value">{profile?.referralCount || 0}</span>
                        <span className="referral-stat-label">{t('profile.friendsInvited')}</span>
                    </div>
                    <div className="referral-stat-item">
                        <span className="referral-stat-value">+{profile?.referralXP || 0} XP</span>
                        <span className="referral-stat-label">{t('profile.referralBonus')}</span>
                    </div>
                </div>
                <button
                    className="invite-friends-btn"
                    onClick={() => {
                        triggerHaptic('selection');
                        setShowInviteModal(true);
                    }}
                >
                    <Users size={20} />
                    {t('profile.inviteButton')}
                </button>
            </div>

            {/* Settings */}
            <div className="profile-section">
                <h3 className="profile-section-title">
                    <Settings size={20} />
                    {t('profile.settings')}
                </h3>

                {/* Language Switcher */}
                <div className="setting-item">
                    <div className="setting-label">
                        <div className="setting-title">{t('profile.appLanguage')}</div>
                        <div className="setting-description">
                            {t('profile.chooseLanguage')}
                        </div>
                    </div>
                    <LanguageSwitcher variant="inline" />
                </div>

                {/* Target Band Score */}
                <div className="setting-item">
                    <div className="setting-label">
                        <div className="setting-title">{t('profile.targetBandScore')}</div>
                        <div className="setting-description">
                            {t('profile.targetBandDesc')}
                        </div>
                    </div>
                    <input
                        type="number"
                        min="4.0"
                        max="9.0"
                        step="0.5"
                        value={targetBand}
                        onChange={(e) => handleTargetBandChange(parseFloat(e.target.value))}
                        className="setting-input"
                    />
                </div>
            </div>

            {/* Account Info */}
            <div className="profile-section">
                <h3 className="profile-section-title">
                    <User size={20} />
                    {t('profile.accountInfo')}
                </h3>
                <div className="profile-info-grid">
                    <div className="profile-info-item">
                        <span className="profile-info-label">{t('profile.userId')}</span>
                        <span className="profile-info-value">{profile?.id || 'N/A'}</span>
                    </div>
                    <div className="profile-info-item">
                        <span className="profile-info-label">{t('profile.telegramId')}</span>
                        <span className="profile-info-value">{profile?.telegramId || 'N/A'}</span>
                    </div>
                    <div className="profile-info-item">
                        <span className="profile-info-label">{t('profile.joined')}</span>
                        <span className="profile-info-value">
                            {formatDate(profile?.createdAt)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="profile-section danger-zone">
                <h3 className="profile-section-title">
                    <AlertTriangle size={20} />
                    {t('profile.dangerZone')}
                </h3>
                <button className="btn-danger" onClick={handleClearProgress}>
                    <AlertTriangle size={16} />
                    {t('profile.clearProgress')}
                </button>
            </div>

            <div className="join-date">
                <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                {t('profile.memberSince', { date: formatDate(profile?.createdAt) })}
            </div>

            {/* Invite Friends Modal */}
            {showInviteModal && (
                <InviteFriendsModal onClose={() => setShowInviteModal(false)} />
            )}
        </div>
    );
}
