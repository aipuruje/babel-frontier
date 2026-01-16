import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Target, Trophy } from 'lucide-react';
import { useModuleStore } from '@/store/moduleStore';
import { triggerHaptic, setBackButton, hideBackButton } from '@/utils/telegram';
import TimeManagementModule from '@/modules/TimeManagement/TimeManagementModule';
import TFNGLogicModule from '@/modules/TFNGLogic/TFNGLogicModule';
import ParaphrasingModule from '@/modules/Paraphrasing/ParaphrasingModule';
import HeadingMatcherModule from '@/modules/HeadingMatcher/HeadingMatcherModule';
import SpeedReadingModule from '@/modules/SpeedReading/SpeedReadingModule';
import CognitiveLoadModule from '@/modules/CognitiveLoad/CognitiveLoadModule';
import Passage3Module from '@/modules/Passage3/Passage3Module';
import VocabExpanderModule from '@/modules/VocabExpander/VocabExpanderModule';
import MockTestsModule from '@/modules/MockTests/MockTestsModule';
import './ModuleView.css';

export default function ModuleView() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const navigate = useNavigate();
    const { modules, selectModule } = useModuleStore();
    const [activeTab, setActiveTab] = useState<'theory' | 'practice' | 'battle'>('theory');

    const module = modules.find((m) => m.id === moduleId);

    useEffect(() => {
        if (moduleId) {
            selectModule(moduleId);
        }
    }, [moduleId, selectModule]);

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
                <p>Module not found</p>
                <button onClick={handleBack}>← Back to Dashboard</button>
            </div>
        );
    }

    if (module.isLocked) {
        return (
            <div className="module-locked-view">
                <div className="lock-icon-large">🔒</div>
                <h2>Module Locked</h2>
                <p>Complete previous modules to unlock this one.</p>
                <button onClick={handleBack}>← Back to Dashboard</button>
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
                        <h1>{module.name}</h1>
                        <p>{module.description}</p>
                    </div>
                </div>

                <div className="module-header-stats">
                    <div className="stat-chip">
                        <Clock size={16} />
                        <span>{module.duration}min</span>
                    </div>
                    <div className="stat-chip">
                        <Target size={16} />
                        <span>{module.progress}%</span>
                    </div>
                    <div className="stat-chip stat-chip-xp">
                        <Trophy size={16} />
                        <span>+{module.xpReward} XP</span>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="module-tabs">
                <button
                    className={`module-tab ${activeTab === 'theory' ? 'active' : ''}`}
                    onClick={() => handleTabChange('theory')}
                >
                    📖 Theory
                </button>
                <button
                    className={`module-tab ${activeTab === 'practice' ? 'active' : ''}`}
                    onClick={() => handleTabChange('practice')}
                >
                    ✏️ Practice
                </button>
                <button
                    className={`module-tab ${activeTab === 'battle' ? 'active' : ''}`}
                    onClick={() => handleTabChange('battle')}
                >
                    ⚔️ Battle
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
                        <h3>Coming Soon</h3>
                        <p>This module is under development.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
