// Achievements & Badges System

import { useState } from 'react';
import { usePlayerState } from '../../lib/playerState';
import './Achievements.css';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    category: 'Combat' | 'Learning' | 'Social' | 'Collection';
    requirement: {
        type: string;
        current: number;
        target: number;
    };
    rewards: {
        xp?: number;
        shards?: number;
    };
    unlocked: boolean;
    claimed: boolean;
}

const mockAchievements: Achievement[] = [
    {
        id: 'FIRST_VICTORY',
        title: 'First Victory',
        description: 'Complete your first quest successfully',
        icon: '🏅',
        rarity: 'common',
        category: 'Combat',
        requirement: { type: 'QUESTS_COMPLETED', current: 0, target: 1 },
        rewards: { xp: 50, shards: 10 },
        unlocked: false,
        claimed: false,
    },
    {
        id: 'FLAWLESS_FIGHTER',
        title: 'Flawless Fighter',
        description: 'Win a battle with full HP remaining',
        icon: '⚔️',
        rarity: 'rare',
        category: 'Combat',
        requirement: { type: 'PERFECT_BATTLE', current: 0, target: 1 },
        rewards: { xp: 100, shards: 25 },
        unlocked: false,
        claimed: false,
    },
    {
        id: 'DEDICATED_SCHOLAR',
        title: 'Dedicated Scholar',
        description: 'Complete 10 quests',
        icon: '📚',
        rarity: 'epic',
        category: 'Learning',
        requirement: { type: 'QUESTS_COMPLETED', current: 0, target: 10 },
        rewards: { xp: 250, shards: 50 },
        unlocked: false,
        claimed: false,
    },
    {
        id: 'HOT_STREAK',
        title: 'Hot Streak',
        description: 'Maintain a 7-day login streak',
        icon: '🔥',
        rarity: 'rare',
        category: 'Learning',
        requirement: { type: 'STREAK', current: 0, target: 7 },
        rewards: { xp: 150, shards: 30 },
        unlocked: false,
        claimed: false,
    },
    {
        id: 'MASTER_READER',
        title: 'Master Reader',
        description: 'Reach 50% Reading mastery',
        icon: '📖',
        rarity: 'epic',
        category: 'Learning',
        requirement: { type: 'MASTERY_READING', current: 0, target: 50 },
        rewards: { xp: 300, shards: 75 },
        unlocked: false,
        claimed: false,
    },
    {
        id: 'TREASURE_HUNTER',
        title: 'Treasure Hunter',
        description: 'Collect 1000 Rune Shards',
        icon: '💎',
        rarity: 'legendary',
        category: 'Collection',
        requirement: { type: 'SHARDS', current: 0, target: 1000 },
        rewards: { xp: 500, shards: 100 },
        unlocked: false,
        claimed: false,
    },
];

type FilterType = 'All' | 'Unlocked' | 'Locked' | 'Claimable';
type CategoryFilter = 'All' | Achievement['category'];

export default function Achievements() {
    const { playerState } = usePlayerState();
    const [filter, setFilter] = useState<FilterType>('All');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
    const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

    // TODO: Sync achievements with actual player progress
    // For now, use mock achievements based on player state
    const achievements = mockAchievements.map(ach => {
        const current =
            ach.requirement.type === 'QUESTS_COMPLETED' ? (playerState.questsCompleted || 0) :
                ach.requirement.type === 'STREAK' ? playerState.streak :
                    ach.requirement.type === 'SHARDS' ? (playerState.shards || playerState.inventory?.shards || 0) :
                        ach.requirement.type === 'MASTERY_READING' ? Math.floor((playerState.mastery?.reading || 0) * 100) :
                            0;

        const unlocked = ach.requirement.type === 'PERFECT_BATTLE'
            ? false // Special case - not yet implemented
            : current >= ach.requirement.target;

        return {
            ...ach,
            requirement: {
                ...ach.requirement,
                current
            },
            unlocked
        };
    });

    const filteredAchievements = achievements.filter(ach => {
        if (filter === 'Unlocked' && !ach.unlocked) return false;
        if (filter === 'Locked' && ach.unlocked) return false;
        if (filter === 'Claimable' && (!ach.unlocked || ach.claimed)) return false;
        if (categoryFilter !== 'All' && ach.category !== categoryFilter) return false;
        return true;
    });

    const handleClaimReward = (achievement: Achievement) => {
        // TODO: Call backend API to claim reward
        console.log('Claiming achievement:', achievement.id);
        alert(`Claimed ${achievement.title}! +${achievement.rewards.xp} XP, +${achievement.rewards.shards} Shards`);
    };

    return (
        <div className="achievements-page">
            <div className="achievements-header">
                <h1>🏆 Achievements</h1>
                <div className="achievement-stats">
                    <span className="stat">
                        {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
                    </span>
                </div>
            </div>

            <div className="achievements-filters">
                <div className="filter-group">
                    {(['All', 'Unlocked', 'Locked', 'Claimable'] as FilterType[]).map(f => (
                        <button
                            key={f}
                            className={`filter-btn ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="filter-group">
                    {(['All', 'Combat', 'Learning', 'Social', 'Collection'] as CategoryFilter[]).map(cat => (
                        <button
                            key={cat}
                            className={`category-filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                            onClick={() => setCategoryFilter(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="achievements-grid">
                {filteredAchievements.map(ach => (
                    <div
                        key={ach.id}
                        className={`achievement-card ${ach.unlocked ? 'unlocked' : 'locked'} rarity-${ach.rarity}`}
                    >
                        <div className="achievement-icon">{ach.icon}</div>
                        <div className="achievement-content">
                            <h3 className="achievement-title">{ach.title}</h3>
                            <p className="achievement-description">{ach.description}</p>

                            <div className="achievement-progress">
                                <div className="progress-bar-container">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${Math.min(100, (ach.requirement.current / ach.requirement.target) * 100)}%`
                                        }}
                                    />
                                </div>
                                <div className="progress-text">
                                    {ach.requirement.current} / {ach.requirement.target}
                                </div>
                            </div>

                            <div className="achievement-footer">
                                <div className={`achievement-rarity rarity-${ach.rarity}`}>
                                    {ach.rarity}
                                </div>
                                {ach.unlocked && !ach.claimed && (
                                    <button
                                        className="btn btn-sm btn-gold claim-btn"
                                        onClick={() => handleClaimReward(ach)}
                                    >
                                        Claim ({ach.rewards.xp} XP, {ach.rewards.shards}✦)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredAchievements.length === 0 && (
                <div className="empty-achievements">
                    <div className="empty-icon">🔍</div>
                    <p>No achievements match your filters</p>
                </div>
            )}

            {/* Unlock Animation Modal */}
            {unlockedAchievement && (
                <div className="unlock-overlay" onClick={() => setUnlockedAchievement(null)}>
                    <div className="unlock-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="unlock-icon pulse-glow">{unlockedAchievement.icon}</div>
                        <h2 className="unlock-title">Achievement Unlocked!</h2>
                        <h3 className="unlock-name">{unlockedAchievement.title}</h3>
                        <p className="unlock-desc">{unlockedAchievement.description}</p>
                        <button
                            className="btn btn-gold"
                            onClick={() => {
                                setUnlockedAchievement(null);
                                handleClaimReward(unlockedAchievement);
                            }}
                        >
                            Claim Rewards
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
