import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Target, Trophy } from 'lucide-react';
import { useModuleStore } from '@/store/moduleStore';
import { useUserStore } from '@/store/userStore';
import { triggerHaptic, setBackButton, hideBackButton } from '@/utils/telegram';
import { useBreakReminder } from '@/hooks/useBreakReminder';
import BreakReminderModal from '@/components/BreakReminderModal';
import './ModuleView.css';

// Lazy load module components
const TimeManagementModule = lazy(() => import('@/modules/TimeManagement/TimeManagementModule'));
const TFNGLogicModule = lazy(() => import('@/modules/TFNGLogic/TFNGLogicModule'));
const ParaphrasingModule = lazy(() => import('@/modules/Paraphrasing/ParaphrasingModule'));
const HeadingMatcherModule = lazy(() => import('@/modules/HeadingMatcher/HeadingMatcherModule'));
const SpeedReadingModule = lazy(() => import('@/modules/SpeedReading/SpeedReadingModule'));
const CognitiveLoadModule = lazy(() => import('@/modules/CognitiveLoad/CognitiveLoadModule'));
const Passage3Module = lazy(() => import('@/modules/Passage3/Passage3Module'));
const VocabExpanderModule = lazy(() => import('@/modules/VocabExpander/VocabExpanderModule'));
const MockTestsModule = lazy(() => import('@/modules/MockTests/MockTestsModule'));

// Loading spinner for module content
function ModuleLoading() {
    return (
        <div className="module-loading">
            <div className="loading-spinner"></div>
            <p>Loading module content...</p>
        </div>
    );
}

export default function ModuleView() {
    const { t } = useTranslation();
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();
    const { modules, selectModule } = useModuleStore();
    const { startFocusSession, endFocusSession } = useUserStore();
    const [activeTab, setActiveTab] = useState<'theory' | 'practice' | 'battle'>('theory');

    // Break reminder integration
    const {
        showBreakModal,
        breakMinutes,
        handleTakeBreak,
        handleContinue,
        handleDismiss,
    } = useBreakReminder();

    const module = modules.find((m) => m.id === moduleId);

    useEffect(() => {
        if (moduleId) {
            selectModule(moduleId);
        }
    }, [moduleId, selectModule]);

    useEffect(() => {
        // Start focus session when module loads
        if (moduleId && module && !module.isLocked) {
            startFocusSession(moduleId);
        }

        // End focus session when leaving module
        return () => {
            endFocusSession();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [moduleId]);

    useEffect(() => {
        // Set up Telegram back button
        setBackButton(() => {
            navigate('/dashboard');
        });

        return () => {
            hideBackButton();
        };
    }, [navigate]);

    const handleBack = () => {
        triggerHaptic('selection');
        navigate('/dashboard');
    };

    const handleTabChange = (tab: 'theory' | 'practice' | 'battle') => {
        triggerHaptic('selection');
        setActiveTab(tab);
    };

    if (!module) {
        return (
            <div className="module-not-found">
                <p>{t('modules.notFound')}</p>
                <button onClick={handleBack}>← {t('modules.backToDashboard')}</button>
            </div>
        );
    }

    if (module.isLocked) {
        return (
            <div className="module-locked-view">
                <div className="lock-icon-large">🔒</div>
                <h2>{t('modules.lockedTitle')}</h2>
                <p>{t('modules.lockedDesc')}</p>
                <button onClick={handleBack}>← {t('modules.backToDashboard')}</button>
            </div>
        );
    }

    return (
        <div className="module-view-container">
            {/* Header */}
            <header className="module-header">
                <button className="back-button" onClick={handleBack}>
                    <ArrowLeft size={20} />
                </button>

                <div className="module-header-content">
                    <div className="module-icon-large">{module.icon}</div>
                    <div className="module-header-text">
                        <h1>{t(module.name)}</h1>
                        <p>{t(module.description)}</p>
                    </div>
                </div>

                <div className="module-header-stats">
                    <div className="stat-chip">
                        <Clock size={16} />
                        <span>{t('modules.estimatedTime', { count: module.duration })}</span>
                    </div>
                    <div className="stat-chip">
                        <Target size={16} />
                        <span>{module.progress}%</span>
                    </div>
                    <div className="stat-chip stat-chip-xp">
                        <Trophy size={16} />
                        <span>{t('modules.xpReward', { count: module.xpReward })}</span>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="module-tabs">
                <button
                    className={`module-tab ${activeTab === 'theory' ? 'active' : ''}`}
                    onClick={() => handleTabChange('theory')}
                >
                    {t('modules.theory')}
                </button>
                <button
                    className={`module-tab ${activeTab === 'practice' ? 'active' : ''}`}
                    onClick={() => handleTabChange('practice')}
                >
                    {t('modules.practice')}
                </button>
                <button
                    className={`module-tab ${activeTab === 'battle' ? 'active' : ''}`}
                    onClick={() => handleTabChange('battle')}
                >
                    {t('modules.battle')}
                </button>
            </nav>

            {/* Module Content */}
            <motion.div
                className="module-content"
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Suspense fallback={<ModuleLoading />}>
                    {moduleId === 'time-management' && (
                        <TimeManagementModule activeTab={activeTab} />
                    )}

                    {moduleId === 'tfng-logic' && (
                        <TFNGLogicModule activeTab={activeTab} />
                    )}

                    {moduleId === 'paraphrasing' && (
                        <ParaphrasingModule activeTab={activeTab} />
                    )}

                    {moduleId === 'heading-matcher' && (
                        <HeadingMatcherModule activeTab={activeTab} />
                    )}

                    {moduleId === 'speed-reading' && (
                        <SpeedReadingModule activeTab={activeTab} />
                    )}

                    {moduleId === 'cognitive-load' && (
                        <CognitiveLoadModule activeTab={activeTab} />
                    )}

                    {moduleId === 'passage-3' && (
                        <Passage3Module activeTab={activeTab} />
                    )}

                    {moduleId === 'vocabulary' && (
                        <VocabExpanderModule activeTab={activeTab} />
                    )}

                    {moduleId === 'mock-tests' && (
                        <MockTestsModule activeTab={activeTab} />
                    )}

                    {moduleId !== 'time-management' && moduleId !== 'tfng-logic' && moduleId !== 'paraphrasing' && moduleId !== 'heading-matcher' && moduleId !== 'speed-reading' && moduleId !== 'cognitive-load' && moduleId !== 'passage-3' && moduleId !== 'vocabulary' && moduleId !== 'mock-tests' && (
                        <div className="module-placeholder">
                            <h3>{t('modules.comingSoon')}</h3>
                            <p>{t('modules.underDevelopment')}</p>
                        </div>
                    )}
                </Suspense>
            </motion.div>

            {/* Break Reminder Modal */}
            {showBreakModal && (
                <BreakReminderModal
                    minutes={breakMinutes}
                    onTakeBreak={handleTakeBreak}
                    onContinue={handleContinue}
                    onDismiss={handleDismiss}
                />
            )}
        </div>
    );
}
