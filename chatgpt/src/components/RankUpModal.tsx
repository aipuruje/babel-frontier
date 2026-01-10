// Rank Up Modal - Celebration when player ranks up

import { useEffect, useState } from 'react';
import './RankUpModal.css';

interface RankUpModalProps {
    oldRank: number;
    newRank: number;
    oldRankTitle: string;
    newRankTitle: string;
    unlockedZones?: string[];
    onClose: () => void;
}

export default function RankUpModal({
    oldRank,
    newRank,
    oldRankTitle,
    newRankTitle,
    unlockedZones = [],
    onClose,
}: RankUpModalProps) {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Delay content reveal for dramatic effect
        const timer = setTimeout(() => setShowContent(true), 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="rank-up-overlay" onClick={onClose}>
            <div className="rank-up-modal" onClick={(e) => e.stopPropagation()}>
                <div className="confetti-container">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`,
                                backgroundColor: [
                                    'var(--color-gold)',
                                    'var(--color-magic-purple)',
                                    'var(--color-magic-cyan)',
                                ][Math.floor(Math.random() * 3)],
                            }}
                        />
                    ))}
                </div>

                <div className={`rank-up-content ${showContent ? 'visible' : ''}`}>
                    <div className="rank-up-icon">🌟</div>

                    <h2 className="rank-up-title">RANK UP!</h2>

                    <div className="rank-transition">
                        <div className="rank-old">
                            <div className="rank-number">{oldRank}</div>
                            <div className="rank-label">{oldRankTitle}</div>
                        </div>

                        <div className="rank-arrow">→</div>

                        <div className="rank-new glow-pulse">
                            <div className="rank-number">{newRank}</div>
                            <div className="rank-label">{newRankTitle}</div>
                        </div>
                    </div>

                    {unlockedZones.length > 0 && (
                        <div className="unlocked-zones">
                            <div className="unlocked-title">🗺️ New Zones Unlocked:</div>
                            {unlockedZones.map(zone => (
                                <div key={zone} className="unlocked-zone">{zone}</div>
                            ))}
                        </div>
                    )}

                    <button className="btn btn-gold rank-up-btn" onClick={onClose}>
                        Continue Your Journey
                    </button>
                </div>
            </div>
        </div>
    );
}
