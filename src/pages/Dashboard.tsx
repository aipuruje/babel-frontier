import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useModuleStore } from '@/store/moduleStore';
import { useUserStore, useCurrentLevel, useXPProgress, useStreakDays } from '@/store/userStore';
import { triggerHaptic } from '@/utils/telegram';
import { BookOpen, Flame, Trophy, Target } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const { modules } = useModuleStore();
    const { profile } = useUserStore();
    const level = useCurrentLevel();
    const xpProgress = useXPProgress();
    const streakDays = useStreakDays();

    const handleModuleClick = (moduleId: string, isLocked: boolean) => {
        if (isLocked) {
            triggerHaptic('error');
            return;
        }

        triggerHaptic('selection');
        navigate(`/module/${moduleId}`);
    };

    // Calculate stats
    const questionsToday = 0; // TODO: Implement from submissions
    const completedModules = modules.filter((m) => m.progress >= 100).length;

    return (
        <div className="dashboard-container">
            {/* Hero Section */}
            <section className="dashboard-hero">
                <div className="dashboard-greeting">
                    <h1>Welcome back, {profile?.firstName || 'Learner'}!</h1>
                    <p>Let's continue your IELTS mastery journey</p>
                </div>

                {/* Band Score Display */}
                <motion.div
                    className="dashboard-band-score"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                    <div className="band-score-label">Current Band</div>
                    <div className="band-score-value">
                        {profile?.currentBand ? profile.currentBand.toFixed(1) : '—'}
                    </div>
                    <div className="band-score-target">Target: {profile?.targetBand || 7.0}</div>
                </motion.div>

                {/* XP Progress Bar */}
                <div className="dashboard-xp-section">
                    <div className="xp-header">
                        <span className="xp-label">Level {level}</span>
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
                        <div className="stat-label">Questions Today</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon stat-icon-fire">
                        <Flame size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{streakDays}</div>
                        <div className="stat-label">Day Streak</div>
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
                        <div className="stat-label">Modules</div>
                    </div>
                </div>
            </section>

            {/* Modules Grid */}
            <section className="dashboard-modules">
                <h2 className="section-title">
                    <BookOpen size={20} />
                    Learning Modules
                </h2>

                <div className="modules-grid">
                    {modules.map((module, index) => (
                        <motion.div
                            key={module.id}
                            className={`module-card ${module.isLocked ? 'locked' : ''} ${module.progress >= 100 ? 'completed' : ''
                                }`}
                            onClick={() => handleModuleClick(module.id, module.isLocked)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={!module.isLocked ? { y: -4, scale: 1.02 } : {}}
                            whileTap={!module.isLocked ? { scale: 0.98 } : {}}
                        >
                            {/* Lock overlay */}
                            {module.isLocked && (
                                <div className="module-lock-overlay">
                                    <span className="lock-icon">🔒</span>
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
                                    <span className="module-duration">⏱️ {module.duration}min</span>
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
                    ))}
                </div>
            </section>
        </div>
    );
}
