// App Layout with Header and Navigation

import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PlayerState } from '../../lib/types';
import './AppLayout.css';

interface AppLayoutProps {
    children: ReactNode;
    playerState: PlayerState;
}

export default function AppLayout({ children, playerState }: AppLayoutProps) {
    const { t } = useTranslation();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

    return (
        <div className="app-layout">
            <header className="app-header">
                <div className="app-header-content">
                    <h1 className="app-title">Archive of Tongues</h1>

                    <div className="player-stats-header">
                        <div className="stat-item">
                            <span className="stat-label">{t('dashboard.rank')}: </span>
                            <span className="stat-value text-gold">{playerState.rank}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">{t('dashboard.xp')}: </span>
                            <span className="stat-value">{playerState.xp}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">{t('dashboard.shards')}: </span>
                            <span className="stat-value text-gold">✦ {playerState.inventory.shards}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">{t('dashboard.streak')}: </span>
                            <span className="stat-value">🔥 {playerState.streak}</span>
                        </div>
                    </div>
                </div>
            </header>

            <nav className="app-nav">
                <Link
                    to="/"
                    className={`nav-link ${isActive('/') && !location.pathname.includes('zones') && !location.pathname.includes('profile') && !location.pathname.includes('inventory') ? 'active' : ''}`}
                >
                    🏠 Dashboard
                </Link>
                <Link
                    to="/zones"
                    className={`nav-link ${isActive('/zones') || isActive('/quest') ? 'active' : ''}`}
                >
                    🗺️ {t('nav.zones')}
                </Link>
                <Link
                    to="/profile"
                    className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
                >
                    👤 {t('nav.profile')}
                </Link>
                <Link
                    to="/inventory"
                    className={`nav-link ${isActive('/inventory') ? 'active' : ''}`}
                >
                    🎒 {t('nav.inventory')}
                </Link>
            </nav>

            <main className="app-main">
                {children}
            </main>
        </div>
    );
}
