import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { getTelegramUser, triggerHaptic } from '@/utils/telegram';

// Pages (to be created)
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import ModuleView from '@/pages/ModuleView';
import Analytics from '@/pages/Analytics';
import Profile from '@/pages/Profile';

function App() {
    const { profile, setProfile, isAuthenticated } = useUserStore();

    useEffect(() => {
        // Auto-authenticate with Telegram user data
        const telegramUser = getTelegramUser();

        if (telegramUser && !isAuthenticated) {
            // Create or load user profile
            const userProfile = {
                id: `tg-${telegramUser.id}`,
                telegramId: telegramUser.id,
                username: telegramUser.username || telegramUser.first_name,
                firstName: telegramUser.first_name,
                xp: profile?.xp || 0,
                level: profile?.level || 1,
                currentBand: profile?.currentBand || 0,
                streakDays: profile?.streakDays || 0,
                lastActive: new Date().toISOString(),
                createdAt: profile?.createdAt || new Date().toISOString()
            };

            setProfile(userProfile);
            triggerHaptic('success');
        }
    }, [isAuthenticated, profile, setProfile]);

    return (
        <BrowserRouter>
            <Routes>
                {/* Landing page for new users */}
                <Route path="/" element={<Landing />} />

                {/* Main app routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/module/:moduleId" element={<ModuleView />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/profile" element={<Profile />} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
