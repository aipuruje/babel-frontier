// Battle Arena - Main quest battle component

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerState, savePlayerState, loadPlayerState, updatePlayerXP, addPlayerShards, addPlayerItem, updatePlayerMastery } from '../../../lib/playerState';
import { getQuestById } from '../../../lib/questData';
import apiClient from '../../../lib/apiClient';
import type { Quest, Task, BattleState } from '../../../lib/types';
import RuneScanTask from '../tasks/RuneScanTask';
import SpellForgeTask from '../tasks/SpellForgeTask';
import TradePactTask from '../tasks/TradePactTask';
import GateSpeakTask from '../tasks/GateSpeakTask';
import BattleResult from './BattleResult';
import './BattleArena.css';

export default function BattleArena() {
    const { questId } = useParams<{ questId: string }>();
    const navigate = useNavigate();
    const { syncFromBackend } = usePlayerState();

    const [quest, setQuest] = useState<Quest | null>(null);
    const [battleState, setBattleState] = useState<BattleState | null>(null);
    const [currentTask, setCurrentTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDamageFlash, setShowDamageFlash] = useState(false);
    const [showAttackFlash, setShowAttackFlash] = useState(false);

    // Load quest data
    useEffect(() => {
        const loadQuest = async () => {
            if (!questId) return;

            try {
                const questData = await getQuestById(questId);
                if (!questData) {
                    navigate('/zones');
                    return;
                }

                setQuest(questData);

                // Initialize battle state
                const initialState: BattleState = {
                    questId: questData.id,
                    currentTaskIndex: 0,
                    playerHP: questData.battle.playerHP,
                    enemyHP: questData.battle.enemyHP,
                    timeRemaining: questData.battle.timeLimitSec,
                    answers: [],
                    status: 'active',
                };

                setBattleState(initialState);
                setCurrentTask(questData.tasks[0]);
                setLoading(false);
            } catch (error) {
                console.error('Failed to load quest:', error);
                navigate('/zones');
            }
        };

        loadQuest();
    }, [questId, navigate]);

    // Timer countdown
    useEffect(() => {
        if (!battleState || battleState.status !== 'active') return;

        const timer = setInterval(() => {
            setBattleState(prev => {
                if (!prev || prev.status !== 'active') return prev;

                const newTime = prev.timeRemaining - 1;

                if (newTime <= 0) {
                    return { ...prev, timeRemaining: 0, status: 'timeout' };
                }

                return { ...prev, timeRemaining: newTime };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [battleState?.status]);

    const handleTaskSubmit = (answer: unknown) => {
        if (!quest || !battleState || !currentTask) return;

        // Check if answer is correct
        const isCorrect = checkAnswer(currentTask, answer);

        // Update battle state
        const newAnswers = [
            ...battleState.answers,
            { taskId: currentTask.id, answer, isCorrect },
        ];

        let newPlayerHP = battleState.playerHP;
        let newEnemyHP = battleState.enemyHP;

        if (isCorrect) {
            // Player attacks enemy
            newEnemyHP = Math.max(0, newEnemyHP - quest.battle.attackPerCorrect);
            setShowAttackFlash(true);
            setTimeout(() => setShowAttackFlash(false), 500);
        } else {
            // Enemy damages player
            newPlayerHP = Math.max(0, newPlayerHP - quest.battle.damagePerWrong);
            setShowDamageFlash(true);
            setTimeout(() => setShowDamageFlash(false), 400);
        }

        // Check win/loss conditions
        let newStatus: BattleState['status'] = 'active';
        if (newEnemyHP <= 0) {
            newStatus = 'victory';
        } else if (newPlayerHP <= 0) {
            newStatus = 'defeat';
        } else if (battleState.currentTaskIndex + 1 >= quest.tasks.length) {
            // All tasks completed
            if (newEnemyHP < battleState.enemyHP) {
                newStatus = 'victory';
            } else {
                newStatus = 'defeat';
            }
        }

        const newBattleState: BattleState = {
            ...battleState,
            playerHP: newPlayerHP,
            enemyHP: newEnemyHP,
            answers: newAnswers,
            status: newStatus,
            currentTaskIndex: battleState.currentTaskIndex + 1,
        };

        setBattleState(newBattleState);

        // Move to next task or end battle
        if (newStatus === 'active' && newBattleState.currentTaskIndex < quest.tasks.length) {
            setCurrentTask(quest.tasks[newBattleState.currentTaskIndex]);
        }
    };

    const checkAnswer = (task: Task, answer: unknown): boolean => {
        // Type guard for answer object
        const isAnswerObject = (val: unknown): val is Record<string, unknown> =>
            typeof val === 'object' && val !== null;

        // Simple answer checking logic
        if (task.type === 'MCQ' || task.type === 'READ_MCQ' || task.type === 'LISTEN_MCQ' || task.type === 'CLOZE' || task.type === 'LISTEN_CLOZE') {
            if (!isAnswerObject(answer)) return false;
            return answer.choiceId === task.expected.choiceId;
        }

        if (task.type === 'SHORT_TEXT' || task.type === 'SPEAK') {
            // For MVP, accept any non-empty answer
            if (!isAnswerObject(answer)) return false;
            const text = answer.text;
            return typeof text === 'string' && text.trim().length > 0;
        }

        return false;
    };

    const handleBattleComplete = async () => {
        if (!quest || !battleState) return;

        if (battleState.status === 'victory') {
            try {
                // Prepare answers for backend submission
                const answers: Record<string, string> = {};
                battleState.answers.forEach((ans, index) => {
                    const taskId = `T${index + 1}`;
                    // Type guard for answer object
                    const isAnswerObject = (val: unknown): val is Record<string, unknown> =>
                        typeof val === 'object' && val !== null;

                    if (isAnswerObject(ans.answer)) {
                        const choiceId = typeof ans.answer.choiceId === 'string' ? ans.answer.choiceId : undefined;
                        const text = typeof ans.answer.text === 'string' ? ans.answer.text : undefined;
                        answers[taskId] = choiceId || text || 'A';
                    } else {
                        answers[taskId] = 'A';
                    }
                });

                // Calculate time spent
                const timeSpentMs = (quest.battle.timeLimitSec - battleState.timeRemaining) * 1000;

                // Submit to backend
                const response = await apiClient.submitQuest(quest.id, answers, timeSpentMs);

                if (response.ok && response.data) {
                    // Sync player state from backend to get updated XP, rank, etc.
                    await syncFromBackend();

                    console.log('Quest submitted successfully:', response.data);
                }
            } catch (error) {
                console.error('Error submitting quest:', error);
            }

            // CRITICAL: Get fresh playerState from localStorage after sync
            // The playerState variable from the hook is stale after syncFromBackend()
            const freshState = loadPlayerState();

            // Always apply rewards locally to ensure shards, items, and questsCompleted persist
            // The backend updates XP/Rank but doesn't track shards/items/questsCompleted yet
            const xpUpdated = await updatePlayerXP(freshState, quest.rewards.xp);
            const shardsUpdated = addPlayerShards(xpUpdated, quest.rewards.shards);

            // Add items
            let itemsUpdated = shardsUpdated;
            quest.rewards.items.forEach(itemId => {
                itemsUpdated = addPlayerItem(itemsUpdated, itemId, 1);
            });

            // Update questsCompleted count
            const finalState: import('../../../lib/types').PlayerState = {
                ...itemsUpdated,
                questsCompleted: (itemsUpdated.questsCompleted || 0) + 1
            };

            // Update mastery based on quest type
            const masteryDelta = 0.01;
            let finalWithMastery = finalState;
            if (quest.template === 'RUNE_SCAN') {
                finalWithMastery = updatePlayerMastery(finalState, 'reading', masteryDelta);
            } else if (quest.template === 'ECHO_HUNT') {
                finalWithMastery = updatePlayerMastery(finalState, 'listening', masteryDelta);
            } else if (quest.template === 'SPELL_FORGE') {
                finalWithMastery = updatePlayerMastery(finalState, 'grammar', masteryDelta);
            } else if (quest.template === 'TRADE_PACT') {
                finalWithMastery = updatePlayerMastery(finalState, 'writing', masteryDelta);
            } else if (quest.template === 'GATE_SPEAK') {
                finalWithMastery = updatePlayerMastery(finalState, 'speaking', masteryDelta);
            }

            // Save the fully updated state and trigger React re-render
            savePlayerState(finalWithMastery);
            window.dispatchEvent(new Event('storage'));
        }
    };


    if (loading) {
        return <div className="loading-state">Loading quest...</div>;
    }

    if (!quest || !battleState) {
        return <div className="error-state">Quest not found</div>;
    }

    // Show result screen if battle is over
    if (battleState.status !== 'active') {
        return (
            <BattleResult
                quest={quest}
                battleState={battleState}
                onComplete={handleBattleComplete}
                onReturn={() => navigate(-1)}
            />
        );
    }

    return (
        <div className={`battle-arena ${showDamageFlash ? 'damage-shake' : ''}`}>
            <div className="battle-header">
                <h2 className="battle-title">{quest.story.title.en}</h2>
                <div className="battle-npc">⚔️ vs {quest.battle.enemy.name.en}</div>
            </div>

            <div className="battle-status">
                <div className="hp-container">
                    <div className="hp-label">Your HP</div>
                    <div className="hp-bar">
                        <div
                            className="hp-fill"
                            style={{ width: `${(battleState.playerHP / quest.battle.playerHP) * 100}%` }}
                        />
                    </div>
                    <div className="hp-text">{battleState.playerHP} / {quest.battle.playerHP}</div>
                </div>

                <div className="timer-container">
                    <div className="timer-icon">⏱️</div>
                    <div className="timer-text">
                        {Math.floor(battleState.timeRemaining / 60)}:{(battleState.timeRemaining % 60).toString().padStart(2, '0')}
                    </div>
                </div>

                <div className={`hp-container ${showAttackFlash ? 'attack-animation' : ''}`}>
                    <div className="hp-label">Enemy HP</div>
                    <div className="hp-bar enemy-hp">
                        <div
                            className="hp-fill"
                            style={{ width: `${(battleState.enemyHP / quest.battle.enemyHP) * 100}%` }}
                        />
                    </div>
                    <div className="hp-text">{battleState.enemyHP} / {quest.battle.enemyHP}</div>
                </div>
            </div>

            <div className="task-progress">
                Task {battleState.currentTaskIndex + 1} of {quest.tasks.length}
            </div>

            <div className="task-container">
                {currentTask && renderTask(currentTask, handleTaskSubmit)}
            </div>
        </div>
    );
}

function renderTask(task: Task, onSubmit: (answer: unknown) => void) {
    switch (task.type) {
        case 'READ_MCQ':
        case 'MCQ':
            return <RuneScanTask task={task} onSubmit={onSubmit} />;

        case 'CLOZE':
            return <SpellForgeTask task={task} onSubmit={onSubmit} />;

        case 'SHORT_TEXT':
            return <TradePactTask task={task} onSubmit={onSubmit} />;

        case 'SPEAK':
            return <GateSpeakTask task={task} onSubmit={onSubmit} />;

        default:
            return (
                <div className="task-placeholder">
                    <p>Task type "{task.type}" not yet implemented</p>
                    <button className="btn btn-secondary" onClick={() => onSubmit({ skip: true })}>
                        Skip Task
                    </button>
                </div>
            );
    }
}
