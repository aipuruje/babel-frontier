// Quest List - Shows all quests in a zone

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getQuestsByZone, getZoneById } from '../../lib/questData';
import type { Quest, Zone } from '../../lib/types';
import './QuestList.css';

const getQuestIcon = (template: string) => {
    const icons: Record<string, string> = {
        RUNE_SCAN: '📖',
        ECHO_HUNT: '👂',
        SPELL_FORGE: '⚒️',
        TRADE_PACT: '✍️',
        GATE_SPEAK: '🗣️',
    };
    return icons[template] || '⚔️';
};

export default function QuestList() {
    const { zoneId } = useParams<{ zoneId: string }>();
    const navigate = useNavigate();
    const [zone, setZone] = useState<Zone | null>(null);
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadQuests = async () => {
            if (!zoneId) return;

            try {
                const zoneData = await getZoneById(zoneId);
                const questsData = await getQuestsByZone(zoneId);

                setZone(zoneData || null);
                setQuests(questsData);
            } catch (error) {
                console.error('Failed to load quests:', error);
            } finally {
                setLoading(false);
            }
        };

        loadQuests();
    }, [zoneId]);

    if (loading) {
        return <div className="loading-state">Loading quests...</div>;
    }

    if (!zone) {
        return (
            <div className="quest-list">
                <div className="error-state">Zone not found</div>
                <button className="btn btn-secondary" onClick={() => navigate('/zones')}>
                    Back to Zones
                </button>
            </div>
        );
    }

    return (
        <div className="quest-list">
            <div className="quest-list-header">
                <button className="btn btn-secondary back-btn" onClick={() => navigate('/zones')}>
                    ← Back to Map
                </button>
                <div>
                    <h2 className="zone-title">{zone.title.en}</h2>
                    <p className="zone-description">{zone.theme}</p>
                </div>
            </div>

            <div className="quests-grid">
                {quests.length === 0 ? (
                    <div className="empty-state">
                        <p>No quests available in this zone yet.</p>
                    </div>
                ) : (
                    quests.map(quest => (
                        <div key={quest.id} className="quest-card">
                            <div className="quest-icon">{getQuestIcon(quest.template)}</div>

                            <div className="quest-info">
                                <h3 className="quest-title">{quest.story.title.en}</h3>
                                <p className="quest-summary">{quest.story.summary.en}</p>

                                <div className="quest-meta">
                                    <span className="quest-npc">👤 {quest.story.npc}</span>
                                    <span className="quest-difficulty">
                                        Difficulty:
                                        {' '.repeat(quest.difficulty)}
                                        {'⭐'.repeat(quest.difficulty)}
                                    </span>
                                </div>

                                <div className="quest-enemy">
                                    <div className="enemy-name">⚔️ {quest.battle.enemy.name.en}</div>
                                    <div className="enemy-intro">{quest.battle.enemy.introLine.en}</div>
                                </div>

                                <div className="quest-rewards">
                                    <div className="reward-item">
                                        <span className="reward-label">XP:</span>
                                        <span className="reward-value">{quest.rewards.xp}</span>
                                    </div>
                                    <div className="reward-item">
                                        <span className="reward-label">Shards:</span>
                                        <span className="reward-value text-gold">✦ {quest.rewards.shards}</span>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to={`/quest/${quest.id}/battle`}
                                className="btn btn-gold quest-start-btn"
                            >
                                Begin Quest
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
