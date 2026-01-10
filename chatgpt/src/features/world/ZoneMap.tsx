// Zone Map - Interactive world map showing all zones

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlayerState } from '../../lib/playerState';
import { getAllZones } from '../../lib/questData';
import type { Zone } from '../../lib/types';
import './ZoneMap.css';

export default function ZoneMap() {
    const { playerState } = usePlayerState();
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadZones = async () => {
            try {
                const zonesData = await getAllZones();
                setZones(zonesData);
            } catch (error) {
                console.error('Failed to load zones:', error);
            } finally {
                setLoading(false);
            }
        };

        loadZones();
    }, []);

    if (loading) {
        return <div className="loading-state">Loading zones...</div>;
    }

    return (
        <div className="zone-map">
            <h2 className="zone-map-title">The Archive - World Map</h2>
            <p className="zone-map-subtitle">Explore the zones and begin your journey</p>

            <div className="zones-grid">
                {zones.map(zone => {
                    const isUnlocked = zone.unlockRank <= playerState.rank;

                    return (
                        <div
                            key={zone.id}
                            className={`zone-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                        >
                            <div className="zone-card-header">
                                <h3 className="zone-card-title">{zone.title.en}</h3>
                                {!isUnlocked && (
                                    <span className="lock-badge">🔒 Rank {zone.unlockRank}</span>
                                )}
                            </div>

                            <p className="zone-theme">{zone.theme}</p>

                            <div className="zone-quest-count">
                                {zone.canonQuestIds.length} Quests Available
                            </div>

                            {isUnlocked ? (
                                <Link
                                    to={`/zones/${zone.id}/quests`}
                                    className="btn btn-primary zone-enter-btn"
                                >
                                    Enter Zone
                                </Link>
                            ) : (
                                <button className="btn btn-secondary zone-enter-btn" disabled>
                                    Locked
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
