import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Swords, Timer, Target, TrendingUp, Trophy, BookOpen } from 'lucide-react';
import { useModuleStore } from '@/store/moduleStore';
import { useUserStore } from '@/store/userStore';
import { triggerHaptic } from '@/utils/telegram';

interface BattleChallenge {
    id: number;
    name: string;
    description: string;
    timeLimit: number;
    wordCount: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    xpReward: number;
}

const BATTLE_CHALLENGES: BattleChallenge[] = [
    { id: 1, name: 'Flash Drill', description: '15 words in 2 minutes', timeLimit: 120, wordCount: 15, difficulty: 'Easy', xpReward: 20 },
    { id: 2, name: 'Word Sprint', description: '30 words in 5 minutes', timeLimit: 300, wordCount: 30, difficulty: 'Medium', xpReward: 45 },
    { id: 3, name: 'Vocabulary Blitz', description: '50 words in 8 minutes', timeLimit: 480, wordCount: 50, difficulty: 'Medium', xpReward: 70 },
    { id: 4, name: 'Master Challenge', description: '75 words in 12 minutes', timeLimit: 720, wordCount: 75, difficulty: 'Hard', xpReward: 100 }
];

export default function BattleMode() {
    const { updateProgress } = useModuleStore();
    const { updateXP } = useUserStore();
    const [selectedChallenge, setSelectedChallenge] = useState<BattleChallenge | null>(null);
    const [battleActive, setBattleActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [battleComplete, setBattleComplete] = useState(false);
    const [personalBest, setPersonalBest] = useState<Record<number, number>>({});

    useEffect(() => {
        const saved = localStorage.getItem('vocab-expander-battle-bests');
        if (saved) setPersonalBest(JSON.parse(saved));
    }, []);

    const handleBattleComplete = useCallback(() => {
        if (!selectedChallenge) return;
        triggerHaptic('success');
        setBattleActive(false);
        setBattleComplete(true);
        const simulatedAccuracy = 70 + Math.random() * 25;
        setAccuracy(simulatedAccuracy);
        updateProgress('vocabulary', { accuracy: simulatedAccuracy, timeSpent: selectedChallenge.timeLimit - timeRemaining, questionsCompleted: selectedChallenge.wordCount, masteryLevel: simulatedAccuracy });
        updateXP(Math.floor(selectedChallenge.xpReward * (simulatedAccuracy / 100)));
        const currentBest = personalBest[selectedChallenge.id] || 0;
        if (simulatedAccuracy > currentBest) {
            const newBests = { ...personalBest, [selectedChallenge.id]: simulatedAccuracy };
            setPersonalBest(newBests);
            localStorage.setItem('vocab-expander-battle-bests', JSON.stringify(newBests));
        }
    }, [selectedChallenge, timeRemaining, updateProgress, updateXP, personalBest]);

    useEffect(() => {
        if (!battleActive || battleComplete) return;
        const timer = setInterval(() => {
            setTimeRemaining((prev: number) => {
                if (prev <= 1) { clearInterval(timer); handleBattleComplete(); return 0; }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [battleActive, battleComplete, handleBattleComplete]);

    const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

    if (battleComplete && selectedChallenge) {
        const isNewBest = accuracy > (personalBest[selectedChallenge.id] || 0);
        return (
            <motion.div className="battle-complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="battle-result-header">
                    <BookOpen size={64} className={`result-trophy ${isNewBest ? 'new-best' : ''}`} />
                    {isNewBest && <motion.div className="new-best-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}>🎉 NEW BEST!</motion.div>}
                    <h2>Battle Complete!</h2>
                    <p className="challenge-name">{selectedChallenge.name}</p>
                </div>
                <div className="battle-stats">
                    <div className="battle-stat"><div className="stat-icon"><Target /></div><div className="stat-value">{Math.round(accuracy)}%</div><div className="stat-label">Accuracy</div></div>
                    <div className="battle-stat"><div className="stat-icon"><Timer /></div><div className="stat-value">{formatTime(selectedChallenge.timeLimit - timeRemaining)}</div><div className="stat-label">Time Used</div></div>
                    <div className="battle-stat"><div className="stat-icon"><TrendingUp /></div><div className="stat-value">+{Math.floor(selectedChallenge.xpReward * (accuracy / 100))}</div><div className="stat-label">XP Earned</div></div>
                </div>
                <div className="personal-best"><strong>Personal Best:</strong><span className="best-score">{personalBest[selectedChallenge.id] ? `${Math.round(personalBest[selectedChallenge.id])}%` : 'First Attempt'}</span></div>
                <div className="battle-actions">
                    <button className="btn-secondary" onClick={() => { setSelectedChallenge(null); setBattleComplete(false); }}>Back to Challenges</button>
                    <button className="btn-primary" onClick={() => { setBattleComplete(false); setBattleActive(true); }}>Retry Challenge</button>
                </div>
            </motion.div>
        );
    }

    if (battleActive && selectedChallenge) {
        return (
            <div className="battle-active">
                <div className="battle-timer"><Timer size={32} /><div className={`time-display ${timeRemaining < 60 ? 'time-critical' : ''}`}>{formatTime(timeRemaining)}</div></div>
                <div className="battle-progress">
                    <h3>{selectedChallenge.name}</h3>
                    <p className="simulation-note">📚 <strong>Vocabulary Speed Challenge!</strong></p>
                    <p>Recall {selectedChallenge.wordCount} academic words as fast as possible. Click below to simulate completion.</p>
                    <button className="btn-primary simulate-btn" onClick={handleBattleComplete}>Complete Battle (Simulation)</button>
                </div>
            </div>
        );
    }

    return (
        <motion.div className="battle-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="battle-intro"><Swords size={48} className="battle-icon" /><h2>Battle Mode</h2><p>Rapid vocabulary recall! Test your memory of academic words under intense time pressure.</p></div>
            <div className="challenges-grid">
                {BATTLE_CHALLENGES.map((challenge) => {
                    const bestScore = personalBest[challenge.id];
                    return (
                        <motion.div key={challenge.id} className={`challenge-card difficulty-${challenge.difficulty.toLowerCase()}`} whileHover={{ scale: 1.02 }} onClick={() => { triggerHaptic('selection'); setSelectedChallenge(challenge); setTimeRemaining(challenge.timeLimit); setBattleComplete(false); }}>
                            <div className="challenge-header"><h4>{challenge.name}</h4><div className={`difficulty-badge badge-${challenge.difficulty.toLowerCase()}`}>{challenge.difficulty}</div></div>
                            <p className="challenge-description">{challenge.description}</p>
                            <div className="challenge-meta">
                                <div className="meta-item"><Timer size={16} /><span>{Math.floor(challenge.timeLimit / 60)} min</span></div>
                                <div className="meta-item"><BookOpen size={16} /><span>{challenge.wordCount} words</span></div>
                                <div className="meta-item"><Trophy size={16} /><span>+{challenge.xpReward} XP</span></div>
                            </div>
                            {bestScore && <div className="personal-best-mini">Best: {Math.round(bestScore)}%</div>}
                        </motion.div>
                    );
                })}
            </div>
            {selectedChallenge && !battleActive && (
                <motion.div className="challenge-details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3>Ready for {selectedChallenge.name}?</h3>
                    <div className="detail-stats">
                        <div className="detail-stat"><strong>{Math.floor(selectedChallenge.timeLimit / 60)}</strong> minutes</div>
                        <div className="detail-stat"><strong>{selectedChallenge.wordCount}</strong> words</div>
                        <div className="detail-stat"><strong>{(selectedChallenge.timeLimit / selectedChallenge.wordCount).toFixed(1)}</strong> sec/word</div>
                    </div>
                    <div className="challenge-actions">
                        <button className="btn-secondary" onClick={() => setSelectedChallenge(null)}>Cancel</button>
                        <button className="btn-primary btn-start-battle" onClick={() => { triggerHaptic('success'); setBattleActive(true); }}><Swords size={16} /> Start Battle</button>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}
