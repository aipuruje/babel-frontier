import { useSubmissionStore } from '@/store/submissionStore';
import { useModuleStore } from '@/store/moduleStore';
import { useUserStore, useCurrentLevel } from '@/store/userStore';
import { useTranslation } from 'react-i18next';
import { BarChart3, Clock, CheckCircle2, XCircle } from 'lucide-react';
import './Analytics.css';

export default function Analytics() {
    const { t } = useTranslation();
    const {
        getTotalQuestions,
        getOverallAccuracy,
        getAccuracyToday,
        getQuestionsToday,
        getSubmissionsByModule,
        getRecentSubmissions
    } = useSubmissionStore();

    const { modules, progress } = useModuleStore();
    const { profile } = useUserStore();
    const level = useCurrentLevel();

    const totalQuestions = getTotalQuestions();
    const overallAccuracy = getOverallAccuracy();
    const questionsToday = getQuestionsToday();
    const accuracyToday = getAccuracyToday();

    // Calculate module-specific statistics
    const moduleStats = modules.map((module) => {
        const submissions = getSubmissionsByModule(module.id);
        const correct = submissions.filter((s) => s.isCorrect).length;
        const accuracy = submissions.length > 0 ? Math.round((correct / submissions.length) * 100) : 0;

        return {
            id: module.id,
            name: module.name,
            icon: module.icon,
            count: submissions.length,
            accuracy,
            progress: progress[module.id]?.accuracy || 0
        };
    }).filter((stat) => stat.count > 0); // Only show modules with activity

    // Get recent activity
    const recentSubmissions = getRecentSubmissions(10);

    // Format time ago
    const timeAgo = (timestamp: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);

        if (seconds < 60) return t('common.justNow');
        if (seconds < 3600) return t('common.minutesAgo', { count: Math.floor(seconds / 60) });
        if (seconds < 86400) return t('common.hoursAgo', { count: Math.floor(seconds / 3600) });
        return t('common.daysAgo', { count: Math.floor(seconds / 86400) });
    };

    // Get module name from ID
    const getModuleName = (moduleId: string) => {
        const module = modules.find((m) => m.id === moduleId);
        return module?.name || moduleId;
    };

    return (
        <div className="analytics-container">
            <header className="analytics-header">
                <h1>{t('analytics.title')}</h1>
                <p>{t('analytics.description')}</p>
            </header>

            {/* Quick Stats */}
            <div className="analytics-stats-grid">
                <div className="analytics-stat-card">
                    <div className="stat-card-label">{t('analytics.questionsCompleted')}</div>
                    <div className="stat-card-value">{totalQuestions}</div>
                    <div className="stat-card-subtitle">{t('analytics.allTime')}</div>
                </div>

                <div className="analytics-stat-card">
                    <div className="stat-card-label">{t('analytics.accuracy')}</div>
                    <div className="stat-card-value">{overallAccuracy}%</div>
                    <div className="stat-card-subtitle">
                        {totalQuestions > 0 ? t('analytics.correctCount', { count: Math.floor((overallAccuracy / 100) * totalQuestions) }) : t('analytics.noDataYet')}
                    </div>
                </div>

                <div className="analytics-stat-card">
                    <div className="stat-card-label">{t('analytics.today')}</div>
                    <div className="stat-card-value">{questionsToday}</div>
                    <div className="stat-card-subtitle">
                        {questionsToday > 0 ? t('analytics.accurate', { percent: accuracyToday }) : t('analytics.noQuestionsYet')}
                    </div>
                </div>

                <div className="analytics-stat-card">
                    <div className="stat-card-label">{t('analytics.currentLevel')}</div>
                    <div className="stat-card-value">{level}</div>
                    <div className="stat-card-subtitle">{profile?.xp || 0} XP</div>
                </div>
            </div>

            {totalQuestions === 0 ? (
                <div className="analytics-chart-section">
                    <div className="empty-state">
                        <div className="empty-state-icon">📊</div>
                        <h3>{t('analytics.noDataYet')}</h3>
                        <p>{t('analytics.completePractice')}</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Module Breakdown */}
                    {moduleStats.length > 0 && (
                        <div className="analytics-chart-section">
                            <h3 className="chart-section-title">
                                <BarChart3 size={20} />
                                {t('analytics.modulePerformance')}
                            </h3>
                            <div className="module-breakdown">
                                {moduleStats.map((stat) => (
                                    <div key={stat.id} className="module-bar">
                                        <div className="module-bar-header">
                                            <div className="module-bar-name">
                                                {stat.icon} {stat.name}
                                            </div>
                                            <div className="module-bar-stats">
                                                <span className="module-bar-accuracy">
                                                    {t('analytics.accurate', { percent: stat.accuracy })}
                                                </span>
                                                <span className="module-bar-count">
                                                    {t('analytics.questions', { count: stat.count })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="module-progress-bar">
                                            <div
                                                className="module-progress-fill"
                                                style={{ width: `${stat.accuracy}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Activity */}
                    {recentSubmissions.length > 0 && (
                        <div className="analytics-chart-section">
                            <h3 className="chart-section-title">
                                <Clock size={20} />
                                {t('analytics.recentActivity')}
                            </h3>
                            <div className="recent-activity">
                                {recentSubmissions.map((submission) => (
                                    <div key={submission.id} className="activity-item">
                                        <div className={`activity-icon ${submission.isCorrect ? 'correct' : 'incorrect'}`}>
                                            {submission.isCorrect ? (
                                                <CheckCircle2 size={20} />
                                            ) : (
                                                <XCircle size={20} />
                                            )}
                                        </div>
                                        <div className="activity-content">
                                            <div className="activity-module">
                                                {getModuleName(submission.moduleId)}
                                            </div>
                                            <div className="activity-time">
                                                {timeAgo(submission.timestamp)}
                                                {submission.timeSpent && ` • ${Math.floor(submission.timeSpent)}s`}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
