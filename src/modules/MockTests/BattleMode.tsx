import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Swords, Timer, Target, TrendingUp, Trophy } from 'lucide-react';
import { useModuleStore } from '@/store/moduleStore';
import { useUserStore } from '@/store/userStore';
import { triggerHaptic } from '@/utils/telegram';

interface BattleChallenge {
    id: number;
    name: string;
    description: string;
    timeLimit: number; // in seconds
    questionCount: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    xpReward: number;
}

const BATTLE_CHALLENGES: BattleChallenge[] = [
    {
        id: 1,
        name: 'Speed Reader',
        description: 'Answer 10 questions in 10 minutes',
        timeLimit: 600,
        questionCount: 10,
        difficulty: 'Easy',
        xpReward: 50
    },
    {
        id: 2,
        name: 'Passage Sprint',
        description: 'Complete 1 full passage in 18 minutes',
        timeLimit: 1080,
        questionCount: 13,
        difficulty: 'Medium',
        xpReward: 75
    },
    {
        id: 3,
        name: 'Time Attack',
        description: 'Answer 20 questions in 25 minutes',
        timeLimit: 1500,
        questionCount: 20,
        difficulty: 'Medium',
        xpReward: 100
    },
    {
        id: 4,
        name: 'Endurance Trial',
        description: 'Complete 2 passages in 35 minutes',
        timeLimit: 2100,
        questionCount: 27,
        difficulty: 'Hard',
        xpReward: 150
    },
    {
        id: 5,
        name: 'Master Challenge',
        description: 'Full test (40 questions) in 55 minutes',
        timeLimit: 3300,
        questionCount: 40,
        difficulty: 'Hard',
        xpReward: 200
    }
];

export default function BattleMode() {
    const { updateProgress } = useModuleStore();
    const { updateXP } = useUserStore();

    const [selectedChallenge, setSelectedChallenge] = useState<BattleChallenge | null>(null);
    const [battleActive, setBattleActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [battleComplete, setBattleComplete] = useState(false);
    const [personalBest, setPersonalBest] = useState<Record<number, number>>({});

    useEffect(() => {
        // Load personal bests from localStorage
        const saved = localStorage.getItem('mock-test-battle-bests');
        if (saved) {
            setPersonalBest(JSON.parse(saved));
        }
    }, []);

    const handleBattleComplete = useCallback(() => {
        if (!selectedChallenge) return;

        triggerHaptic('success');
        setBattleActive(false);
        setBattleComplete(true);

        // Simulate completion (in real app, this would use actual question data)
        const simulatedAccuracy = 70 + Math.random() * 25; // 70-95%
        setAccuracy(simulatedAccuracy);

        // Update progress
        updateProgress('mock-tests', {
            accuracy: simulatedAccuracy,
            timeSpent: selectedChallenge.timeLimit - timeRemaining,
            questionsCompleted: selectedChallenge.questionCount,
            masteryLevel: simulatedAccuracy
        });

        // Award XP
        const xpEarned = Math.floor(selectedChallenge.xpReward * (simulatedAccuracy / 100));
        updateXP(xpEarned);

        // Update personal best
        const currentBest = personalBest[selectedChallenge.id] || 0;
        if (simulatedAccuracy > currentBest) {
            const newBests = {
                ...personalBest,
                [selectedChallenge.id]: simulatedAccuracy
            };
            setPersonalBest(newBests);
            localStorage.setItem('mock-test-battle-bests', JSON.stringify(newBests));
        }
    }, [selectedChallenge, timeRemaining, updateProgress, updateXP, personalBest]);

    useEffect(() => {
        if (!battleActive || battleComplete) return;

        const timer = setInterval(() => {
            setTimeRemaining((prev: number) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleBattleComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [battleActive, battleComplete, handleBattleComplete]);

    const handleSelectChallenge = (challenge: BattleChallenge) => {
        triggerHaptic('selection');
        setSelectedChallenge(challenge);
        setTimeRemaining(challenge.timeLimit);
        setQuestionsAnswered(0);
        setAccuracy(0);
        setBattleComplete(false);
    };

    const handleStartBattle = () => {
        triggerHaptic('success');
        setBattleActive(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (battleComplete && selectedChallenge) {
        const isNewBest = accuracy > (personalBest[selectedChallenge.id] || 0);

        return (
            <motion.div
                className="battle-complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="battle-result-header">
                    <Trophy size={64} className={`result-trophy ${isNewBest ? 'new-best' : ''}`} />
                    {isNewBest && (
                        <motion.div
                            className="new-best-badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                        >
                            🎉 NEW BEST!
                        </motion.div>
                    )}
                    <h2>Battle Complete!</h2>
                    <p className="challenge-name">{selectedChallenge.name}</p>
                </div>

                <div className="battle-stats">
                    <div className="battle-stat">
                        <div className="stat-icon"><Target /></div>
                        <div className="stat-value">{Math.round(accuracy)}%</div>
                        <div className="stat-label">Accuracy</div>
                    </div>
                    <div className="battle-stat">
                        <div className="stat-icon"><Timer /></div>
                        <div className="stat-value">{formatTime(selectedChallenge.timeLimit - timeRemaining)}</div>
                        <div className="stat-label">Time Used</div>
                    </div>
                    <div className="battle-stat">
                        <div className="stat-icon"><TrendingUp /></div>
                        <div className="stat-value">+{Math.floor(selectedChallenge.xpReward * (accuracy / 100))}</div>
                        <div className="stat-label">XP Earned</div>
                    </div>
                </div>

                <div className="personal-best">
                    <strong>Personal Best:</strong>
                    <span className="best-score">
                        {personalBest[selectedChallenge.id]
                            ? `${Math.round(personalBest[selectedChallenge.id])}%`
                            : 'First Attempt'}
                    </span>
                </div>

                <div className="battle-actions">
                    <button
                        className="btn-secondary"
                        onClick={() => {
                            setSelectedChallenge(null);
                            setBattleComplete(false);
                        }}
                    >
                        Back to Challenges
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => {
                            setBattleComplete(false);
                            handleStartBattle();
                        }}
                    >
                        Retry Challenge
                    </button>
                </div>
            </motion.div>
        );
    }

    if (battleActive && selectedChallenge) {
        return (
            <div className="battle-active">
                <div className="battle-timer">
                    <Timer size={32} />
                    <div className={`time-display ${timeRemaining < 60 ? 'time-critical' : ''}`}>
                        {formatTime(timeRemaining)}
                    </div>
                </div>

                <div className="battle-progress">
                    <h3>{selectedChallenge.name}</h3>
                    <div className="progress-tracker">
                        <div className="progress-bar">
                            <div
                                className="progress-fill-battle"
                                style={{
                                    width: `${(questionsAnswered / selectedChallenge.questionCount) * 100}%`
                                }}
                            />
                        </div>
                        <span>{questionsAnswered}/{selectedChallenge.questionCount} completed</span>
                    </div>
                </div>

                <div className="battle-simulation">
                    <p className="simulation-note">
                        ⚔️ <strong>Battle in Progress...</strong>
                    </p>
                    <p>
                        In a full implementation, this would show actual IELTS questions with
                        live timing and scoring. For now, click the button below to simulate
                        completing the challenge.
                    </p>
                    <button
                        className="btn-primary simulate-btn"
                        onClick={handleBattleComplete}
                    >
                        Complete Battle (Simulation)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className="battle-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="battle-intro">
                <Swords size={48} className="battle-icon" />
                <h2>Battle Mode</h2>
                <p>
                    Test your speed and accuracy under extreme time pressure. Choose a challenge
                    and compete against the clock to earn XP and beat your personal best!
                </p>
            </div>

            <div className="challenges-grid">
                {BATTLE_CHALLENGES.map((challenge) => {
                    const bestScore = personalBest[challenge.id];

                    return (
                        <motion.div
                            key={challenge.id}
                            className={`challenge-card difficulty-${challenge.difficulty.toLowerCase()}`}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => handleSelectChallenge(challenge)}
                        >
                            <div className="challenge-header">
                                <h4>{challenge.name}</h4>
                                <div className={`difficulty-badge badge-${challenge.difficulty.toLowerCase()}`}>
                                    {challenge.difficulty}
                                </div>
                            </div>

                            <p className="challenge-description">{challenge.description}</p>

                            <div className="challenge-meta">
                                <div className="meta-item">
                                    <Timer size={16} />
                                    <span>{Math.floor(challenge.timeLimit / 60)} min</span>
                                </div>
                                <div className="meta-item">
                                    <Target size={16} />
                                    <span>{challenge.questionCount} questions</span>
                                </div>
                                <div className="meta-item">
                                    <Trophy size={16} />
                                    <span>+{challenge.xpReward} XP</span>
                                </div>
                            </div>

                            {bestScore && (
                                <div className="personal-best-mini">
                                    Best: {Math.round(bestScore)}%
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {selectedChallenge && !battleActive && (
                <motion.div
                    className="challenge-details"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h3>Ready for {selectedChallenge.name}?</h3>
                    <div className="detail-stats">
                        <div className="detail-stat">
                            <strong>{Math.floor(selectedChallenge.timeLimit / 60)}</strong> minutes
                        </div>
                        <div className="detail-stat">
                            <strong>{selectedChallenge.questionCount}</strong> questions
                        </div>
                        <div className="detail-stat">
                            <strong>{(selectedChallenge.timeLimit / selectedChallenge.questionCount / 60).toFixed(1)}</strong> min/question
                        </div>
                    </div>

                    <div className="challenge-tips">
                        <h4>⚡ Quick Tips:</h4>
                        <ul>
                            <li>Stay focused—every second counts</li>
                            <li>Skip difficult questions and return to them later</li>
                            <li>Trust your first instinct to save time</li>
                            <li>Keep an eye on the timer and pace yourself</li>
                        </ul>
                    </div>

                    <div className="challenge-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => setSelectedChallenge(null)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-primary btn-start-battle"
                            onClick={handleStartBattle}
                        >
                            <Swords size={16} /> Start Battle
                        </button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
