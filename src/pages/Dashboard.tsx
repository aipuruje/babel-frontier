import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useModuleStore } from '@/store/moduleStore';
import { useUserStore, useCurrentLevel, useXPProgress, useStreakDays } from '@/store/userStore';
import { useSubmissionStore } from '@/store/submissionStore';
import { triggerHaptic } from '@/utils/telegram';
import { canAccessModule, getUserPlan } from '@/data/pricing';
import { BookOpen, Flame, Trophy, Target, Zap, Lock } from 'lucide-react';
import { SessionInfo } from '@/components/SessionInfo';
import PricingModal from '@/components/PricingModal';
import UpgradePrompt from '@/components/UpgradePrompt';
import './Dashboard.css';

export default function Dashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { modules } = useModuleStore();
    const { profile } = useUserStore();
    const level = useCurrentLevel();
    const xpProgress = useXPProgress();
    const streakDays = useStreakDays();
    const getQuestionsToday = useSubmissionStore((state) => state.getQuestionsToday);

    // Monetization state
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
    const userTier = getUserPlan(profile?.isPremium, profile?.isLifetime);

    const handleModuleClick = (moduleId: string, isLocked: boolean) => {
        if (isLocked) {
            triggerHaptic('error');
            // Show upgrade prompt for locked modules
            setShowUpgradePrompt(true);
            return;
        }

        triggerHaptic('selection');
        navigate(`/module/${moduleId}`);
    };

    const handleUpgrade = () => {
        setShowUpgradePrompt(false);
        setShowPricingModal(true);
    };

    // Calculate stats
    const questionsToday = getQuestionsToday();
    const completedModules = modules.filter((m) => m.progress >= 100).length;

    return (
        <div className="dashboard-container">
            {/* Hero Section */}
            <section className="dashboard-hero">
                <div className="dashboard-greeting">
                    <h1>{t('dashboard.welcomeBack', { name: profile?.firstName || 'Learner' })}</h1>
                    <p>{t('dashboard.continueJourney')}</p>
                </div>

                {/* Band Score Display */}
                <motion.div
                    className="dashboard-band-score"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                    <div className="band-score-label">{t('dashboard.currentBand')}</div>
                    <div className="band-score-value">
                        {profile?.currentBand ? profile.currentBand.toFixed(1) : '—'}
                    </div>
                    <div className="band-score-target">{t('dashboard.targetBand')}: {profile?.targetBand || 7.0}</div>
                </motion.div>

                {/* XP Progress Bar */}
                <div className="dashboard-xp-section">
                    <div className="xp-header">
                        <span className="xp-label">{t('dashboard.level')} {level}</span>
                        <span className="xp-value">
                            {xpProgress.current} / {xpProgress.required} XP
                        </span>
                    </div>
                    <div className="xp-bar">
                        <motion.div
                            className="xp-bar-fill"
                            initial={{ width: 0 }}
                            animate={{ width: `${xpProgress.percentage}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </div>
                    <div className="xp-percentage">{xpProgress.percentage}%</div>
                </div>
            </section>

            {/* Quick Stats */}
            <section className="dashboard-stats">
                <div className="stat-card">
                    <div className="stat-icon">
                        <Target size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{questionsToday}</div>
                        <div className="stat-label">{t('dashboard.questionsToday')}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-fire">
                        <Flame size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{streakDays}</div>
                        <div className="stat-label">{t('dashboard.dayStreak')}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-trophy">
                        <Trophy size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">
                            {completedModules}/{modules.length}
                        </div>
                        <div className="stat-label">{t('dashboard.modules')}</div>
                    </div>
                </div>
            </section>

            {/* Power Hour Challenge Section */}
            <section className="dashboard-power-hour">
                <motion.button
                    className="power-hour-cta"
                    onClick={() => navigate('/power-hour')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="power-hour-icon">
                        <Zap size={32} />
                    </div>
                    <div className="power-hour-content">
                        <h3 className="power-hour-title">{t('dashboard.powerHour')}</h3>
                        <p className="power-hour-desc">{t('dashboard.powerHourDesc')}</p>
                    </div>
                    <div className="power-hour-arrow">→</div>
                </motion.button>
            </section>

            {/* Modules Grid */}
            <section className="dashboard-modules">
                <h2 className="section-title">
                    <BookOpen size={20} />
                    {t('dashboard.learningModules')}
                </h2>

                <div className="modules-grid">
                    {modules.map((module, index) => {
                        const isPremiumLocked = !canAccessModule(module.id, userTier);
                        const isLockedByProgression = module.isLocked;
                        const isAnyLocked = isLockedByProgression || isPremiumLocked;

                        return (
                            <motion.div
                                key={module.id}
                                className={`module-card ${isLockedByProgression ? 'locked' : ''} ${isPremiumLocked ? 'premium-locked' : ''} ${module.progress >= 100 ? 'completed' : ''
                                    }`}
                                onClick={() => handleModuleClick(module.id, isAnyLocked)}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={!isAnyLocked ? { y: -4, scale: 1.02 } : {}}
                                whileTap={!isAnyLocked ? { scale: 0.98 } : {}}
                            >
                                {/* Lock overlay */}
                                {(isLockedByProgression || isPremiumLocked) && (
                                    <div className="module-lock-overlay">
                                        {isPremiumLocked ? (
                                            <span className="lock-icon"><Lock size={32} /></span>
                                        ) : (
                                            <span className="lock-icon">🔒</span>
                                        )}
                                        {isPremiumLocked && (
                                            <span className="premium-label">{t('modules.premium')}</span>
                                        )}
                                    </div>
                                )}

                                {/* Completion badge */}
                                {module.progress >= 100 && (
                                    <div className="module-complete-badge">✓</div>
                                )}

                                <div className="module-icon">{module.icon}</div>

                                <div className="module-info">
                                    <h3 className="module-name">{module.name}</h3>
                                    <p className="module-description">{module.description}</p>

                                    <div className="module-meta">
                                        <SessionInfo
                                            duration={module.estimatedTime.total}
                                            variant="card"
                                        />
                                        <span className="module-xp">
                                            <span className="xp-badge">+{module.xpReward} XP</span>
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    {!module.isLocked && (
                                        <div className="module-progress">
                                            <div className="module-progress-bar">
                                                <div
                                                    className="module-progress-fill"
                                                    style={{ width: `${module.progress}%` }}
                                                />
                                            </div>
                                            <span className="module-progress-text">{module.progress}%</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Modals */}
            {showUpgradePrompt && (
                <UpgradePrompt
                    context="module-locked"
                    onClose={() => setShowUpgradePrompt(false)}
                    onUpgrade={handleUpgrade}
                />
            )}

            {showPricingModal && (
                <PricingModal
                    onClose={() => setShowPricingModal(false)}
                    currentTier={userTier}
                    highlightTier="lifetime"
                />
            )}
        </div>
    );
}
