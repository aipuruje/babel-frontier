// Battle Result Screen - Victory/Defeat

import { useState, useEffect } from 'react';
import type { Quest, BattleState } from '../../../lib/types';
import { usePlayerState } from '../../../lib/playerState';
import { getRankForXP } from '../../../lib/questData';
import RankUpModal from '../../../components/RankUpModal';
import './BattleResult.css';

interface BattleResultProps {
    quest: Quest;
    battleState: BattleState;
    onComplete: () => void;
    onReturn: () => void;
}

export default function BattleResult({ quest, battleState, onComplete, onReturn }: BattleResultProps) {
    const isVictory = battleState.status === 'victory';
    const { playerState } = usePlayerState();

    const [showRewards, setShowRewards] = useState(false);
    const [showXP, setShowXP] = useState(false);
    const [showShards, setShowShards] = useState(false);
    const [showItems, setShowItems] = useState(false);
    const [showRankUp, setShowRankUp] = useState(false);
    const [oldRank, setOldRank] = useState(playerState.rank);
    const [newRank, setNewRank] = useState(playerState.rank);

    useEffect(() => {
        if (!isVictory) return;

        // Sequential reveal animation
        const timer1 = setTimeout(() => setShowRewards(true), 500);
        const timer2 = setTimeout(() => setShowXP(true), 800);
        const timer3 = setTimeout(() => setShowShards(true), 1200);
        const timer4 = setTimeout(() => setShowItems(true), 1600);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            clearTimeout(timer4);
        };
    }, [isVictory]);

    const handleContinue = async () => {
        const currentRank = playerState.rank;

        // Call onComplete to update player state
        await onComplete();

        // Check for rank up after XP is added
        setTimeout(async () => {
            const newXP = playerState.xp + quest.rewards.xp;
            const rankInfo = await getRankForXP(newXP);

            if (rankInfo.rank > currentRank) {
                // Player ranked up!
                setOldRank(currentRank);
                setNewRank(rankInfo.rank);
                setShowRankUp(true);
            } else {
                // No rank up, just return
                onReturn();
            }
        }, 100);
    };

    const handleRankUpClose = () => {
        setShowRankUp(false);
        onReturn();
    };

    return (
        <>
            <div className={`battle-result ${isVictory ? 'victory' : 'defeat'}`}>
                <div className="result-icon">
                    {isVictory ? '🏆' : '💀'}
                </div>

                <h2 className="result-title">
                    {isVictory ? 'Victory!' : battleState.status === 'timeout' ? 'Time Up!' : 'Defeated'}
                </h2>

                {isVictory ? (
                    <div className="victory-content">
                        <p className="result-message">
                            You have defeated {quest.battle.enemy.name.en}!
                        </p>

                        {showRewards && (
                            <div className="rewards-section fade-in">
                                <h3>Rewards Earned</h3>
                                <div className="rewards-grid">
                                    {showXP && (
                                        <div className="reward-card slide-in" style={{ animationDelay: '0.1s' }}>
                                            <div className="reward-icon reward-shine">⭐</div>
                                            <div className="reward-label">Experience</div>
                                            <div className="reward-value xp-gain">+{quest.rewards.xp} XP</div>
                                        </div>
                                    )}

                                    {showShards && (
                                        <div className="reward-card slide-in" style={{ animationDelay: '0.2s' }}>
                                            <div className="reward-icon reward-shine">✦</div>
                                            <div className="reward-label">Rune Shards</div>
                                            <div className="reward-value text-gold">+{quest.rewards.shards}</div>
                                        </div>
                                    )}

                                    {showItems && quest.rewards.items.length > 0 && (
                                        <div className="reward-card slide-in" style={{ animationDelay: '0.3s' }}>
                                            <div className="reward-icon reward-shine">🎁</div>
                                            <div className="reward-label">Items</div>
                                            <div className="reward-value">{quest.rewards.items.length}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="battle-stats">
                            <div className="stat-row">
                                <span>Tasks Completed:</span>
                                <span>{battleState.answers.filter(a => a.isCorrect).length} / {quest.tasks.length}</span>
                            </div>
                            <div className="stat-row">
                                <span>HP Remaining:</span>
                                <span>{battleState.playerHP} / {quest.battle.playerHP}</span>
                            </div>
                            <div className="stat-row">
                                <span>Time Remaining:</span>
                                <span>{Math.floor(battleState.timeRemaining / 60)}:{(battleState.timeRemaining % 60).toString().padStart(2, '0')}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="defeat-content">
                        <p className="result-message">
                            {battleState.status === 'timeout'
                                ? 'You ran out of time!'
                                : `${quest.battle.enemy.name.en} has defeated you!`
                            }
                        </p>

                        <div className="battle-stats">
                            <div className="stat-row">
                                <span>Tasks Completed:</span>
                                <span>{battleState.answers.filter(a => a.isCorrect).length} / {quest.tasks.length}</span>
                            </div>
                            <div className="stat-row">
                                <span>Enemy HP Remaining:</span>
                                <span>{battleState.enemyHP} / {quest.battle.enemyHP}</span>
                            </div>
                        </div>

                        <p className="encourage-text">
                            Don't give up! Try again to claim your rewards.
                        </p>
                    </div>
                )}

                <button className="btn btn-gold result-btn" onClick={handleContinue}>
                    {isVictory ? 'Claim Rewards' : 'Try Again'}
                </button>
            </div>

            {showRankUp && (
                <RankUpModal
                    oldRank={oldRank}
                    newRank={newRank}
                    oldRankTitle={`Rank ${oldRank}`}
                    newRankTitle={`Rank ${newRank}`}
                    unlockedZones={[]} // TODO: Calculate unlocked zones
                    onClose={handleRankUpClose}
                />
            )}
        </>
    );
}
