import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, BarChart3, User } from 'lucide-react';
import { triggerHaptic } from '@/utils/telegram';
import './BottomNav.css';

export default function BottomNav() {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/dashboard', icon: Home, label: t('nav.home') },
        { path: '/analytics', icon: BarChart3, label: t('nav.analytics') },
        { path: '/profile', icon: User, label: t('nav.profile') }
    ];

    const handleNavigation = (path: string) => {
        if (location.pathname !== path) {
            triggerHaptic('selection');
            navigate(path);
        }
    };

    return (
        <nav className="bottom-nav">
            {navItems.map(({ path, icon: Icon, label }) => {
                const isActive = location.pathname === path;
                return (
                    <button
                        key={path}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => handleNavigation(path)}
                        aria-label={label}
                    >
                        <Icon size={24} />
                        <span className="nav-label">{label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
