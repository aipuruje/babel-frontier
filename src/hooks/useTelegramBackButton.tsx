import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setBackButton, hideBackButton, triggerHaptic } from '@/utils/telegram';

/**
 * Custom hook to integrate with Telegram's native back button
 * Shows/hides back button based on current route
 * 
 * @param onBack - Optional custom back handler
 * @param enabled - Whether to enable the back button (default: true)
 */
export const useTelegramBackButton = (
    onBack?: () => void,
    enabled: boolean = true
) => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!enabled) {
            hideBackButton();
            return;
        }

        // Root routes don't need back button
        const rootRoutes = ['/', '/dashboard', '/analytics', '/profile'];
        const isRootRoute = rootRoutes.includes(location.pathname);

        if (isRootRoute) {
            hideBackButton();
        } else {
            // Show back button for non-root routes
            setBackButton(() => {
                triggerHaptic('selection');
                if (onBack) {
                    onBack();
                } else {
                    // Default behavior: navigate back
                    navigate(-1);
                }
            }, true);
        }

        // Cleanup on unmount
        return () => {
            hideBackButton();
        };
    }, [location.pathname, navigate, onBack, enabled]);
};
