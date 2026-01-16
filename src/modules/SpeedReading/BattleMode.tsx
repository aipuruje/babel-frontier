import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Swords, Timer, Target, TrendingUp, Trophy, Zap } from 'lucide-react';
import { useModuleStore } from '@/store/moduleStore';
import { useUserStore } from '@/store/userStore';
import { triggerHaptic } from '@/utils/telegram';

interface BattleChallenge {
    id: number;
    name: string;
    description: string;
    timeLimit: number;
    targetWPM: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    xpReward: number;
}

const BATTLE_CHALLENGES: BattleChallenge[] = [
    { id: 1, name: 'Warm-up Sprint', description: 'Read at 300 WPM for 3 minutes', timeLimit: 180, targetWPM: 300, difficulty: 'Easy', xpReward: 25 },
    { id: 2, name: 'Speed Challenge', description: 'Read at 350 WPM for 5 minutes', timeLimit: 300, targetWPM: 350, difficulty: 'Medium', xpReward: 50 },
    { id: 3, name: 'Velocity Test', description: 'Read at 400 WPM for 8 minutes', timeLimit: 480, targetWPM: 400, difficulty: 'Hard', xpReward: 75 },
    { id: 4, name: 'Lightning Round', description: 'Read at 450 WPM for 10 minutes', timeLimit: 600, targetWPM: 450, difficulty: 'Hard', xpReward: 100 }
];

export default function BattleMode() {
    const { updateProgress } = useModuleStore();
    const { updateXP } = useUserStore();
    const [selectedChallenge, setSelectedChallenge] = useState<BattleChallenge | null>(null);
    const [battleActive, setBattleActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [wpm, setWpm] = useState(0);
    const [battleComplete, setBattleComplete] = useState(false);
    const [personalBest, setPersonalBest] = useState<Record<number, number>>({});

    useEffect(() => {
        const saved = localStorage.getItem('speed-reading-battle-bests');
        if (saved) setPersonalBest(JSON.parse(saved));
    }, []);

    const handleBattleComplete = useCallback(() => {
        if (!selectedChallenge) return;
        triggerHaptic('success');
        setBattleActive(false);
        setBattleComplete(true);
        const achievedWPM = selectedChallenge.targetWPM * (0.85 + Math.random() * 0.20); // 85-105% of target
        setWpm(achievedWPM);
        const accuracy = Math.min(100, (achievedWPM / selectedChallenge.targetWPM) * 100);
        updateProgress('speed-reading', { accuracy, timeSpent: selectedChallenge.timeLimit - timeRemaining, questionsCompleted: 1, masteryLevel: accuracy });
        updateXP(Math.floor(selectedChallenge.xpReward * (accuracy / 100)));
        const currentBest = personalBest[selectedChallenge.id] || 0;
        if (achievedWPM > currentBest) {
            const newBests = { ...personalBest, [selectedChallenge.id]: achievedWPM };
            setPersonalBest(newBests);
            localStorage.setItem('speed-reading-battle-bests', JSON.stringify(newBests));
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
        const isNewBest = wpm > (personalBest[selectedChallenge.id] || 0);
        return (
            <motion.div className="battle-complete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="battle-result-header">
                    <Zap size={64} className={`result-trophy ${isNewBest ? 'new-best' : ''}`} />
                    {isNewBest && <motion.div className="new-best-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring' }}>🎉 NEW BEST!</motion.div>}
                    <h2>Battle Complete!</h2>
                    <p className="challenge-name">{selectedChallenge.name}</p>
                </div>
                <div className="battle-stats">
                    <div className="battle-stat"><div className="stat-icon"><Zap /></div><div className="stat-value">{Math.round(wpm)}</div><div className="stat-label">WPM Achieved</div></div>
                    <div className="battle-stat"><div className="stat-icon"><Target /></div><div className="stat-value">{selectedChallenge.targetWPM}</div><div className="stat-label">Target WPM</div></div>
                    <div className="battle-stat"><div className="stat-icon"><TrendingUp /></div><div className="stat-value">+{Math.floor(selectedChallenge.xpReward * Math.min(100, (wpm / selectedChallenge.targetWPM) * 100) / 100)}</div><div className="stat-label">XP Earned</div></div>
                </div>
                <div className="personal-best"><strong>Personal Best:</strong><span className="best-score">{personalBest[selectedChallenge.id] ? `${Math.round(personalBest[selectedChallenge.id])} WPM` : 'First Attempt'}</span></div>
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
                    <p className="simulation-note">⚡ <strong>Speed Reading Challenge!</strong></p>
                    <p>Target: {selectedChallenge.targetWPM} WPM. Click below to simulate completion.</p>
                    <button className="btn-primary simulate-btn" onClick={handleBattleComplete}>Complete Battle (Simulation)</button>
                </div>
            </div>
        );
    }

    return (
        <motion.div className="battle-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="battle-intro"><Swords size={48} className="battle-icon" /><h2>Battle Mode</h2><p>Push your reading speed to the limit! Hit target WPM goals under time pressure.</p></div>
            <div className="challenges-grid">
                {BATTLE_CHALLENGES.map((challenge) => {
                    const bestScore = personalBest[challenge.id];
                    return (
                        <motion.div key={challenge.id} className={`challenge-card difficulty-${challenge.difficulty.toLowerCase()}`} whileHover={{ scale: 1.02 }} onClick={() => { triggerHaptic('selection'); setSelectedChallenge(challenge); setTimeRemaining(challenge.timeLimit); setBattleComplete(false); }}>
                            <div className="challenge-header"><h4>{challenge.name}</h4><div className={`difficulty-badge badge-${challenge.difficulty.toLowerCase()}`}>{challenge.difficulty}</div></div>
                            <p className="challenge-description">{challenge.description}</p>
                            <div className="challenge-meta">
                                <div className="meta-item"><Timer size={16} /><span>{Math.floor(challenge.timeLimit / 60)} min</span></div>
                                <div className="meta-item"><Zap size={16} /><span>{challenge.targetWPM} WPM</span></div>
                                <div className="meta-item"><Trophy size={16} /><span>+{challenge.xpReward} XP</span></div>
                            </div>
                            {bestScore && <div className="personal-best-mini">Best: {Math.round(bestScore)} WPM</div>}
                        </motion.div>
                    );
                })}
            </div>
            {selectedChallenge && !battleActive && (
                <motion.div className="challenge-details" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3>Ready for {selectedChallenge.name}?</h3>
                    <div className="detail-stats">
                        <div className="detail-stat"><strong>{Math.floor(selectedChallenge.timeLimit / 60)}</strong> minutes</div>
                        <div className="detail-stat"><strong>{selectedChallenge.targetWPM}</strong> WPM target</div>
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
