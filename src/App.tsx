import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import { getTelegramUser, triggerHaptic } from '@/utils/telegram';
import { generateReferralCode } from '@/utils/referralCodes';

// Lazy load pages for code splitting
const Landing = lazy(() => import('@/pages/Landing'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ModuleView = lazy(() => import('@/pages/ModuleView'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Profile = lazy(() => import('@/pages/Profile'));
const OnboardingWelcome = lazy(() => import('@/pages/OnboardingWelcome'));
const QuickTutorial = lazy(() => import('@/pages/QuickTutorial'));

// Eagerly load critical components
import BottomNav from '@/components/BottomNav';
import SignUpModal from '@/components/SignUpModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorFallback from '@/components/ErrorFallback';

// Lazy load PowerHourChallenge (less critical)
const PowerHourChallenge = lazy(() => import('@/components/PowerHourChallenge'));

// Loading fallback component
function LoadingFallback() {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: '#0f172a',
            color: '#fff'
        }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(102, 126, 234, 0.3)',
                    borderTop: '3px solid #667eea',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 16px'
                }}></div>
                <p>Loading...</p>
            </div>
        </div>
    );
}

function AppContent() {
    const location = useLocation();
    const { profile } = useUserStore();
    const showBottomNav = !['/'].includes(location.pathname) &&
        !location.pathname.startsWith('/module/') &&
        !['/welcome', '/tutorial'].includes(location.pathname);

    return (
        <>
            <AnimatePresence mode="wait" initial={false}>
                <ErrorBoundary fallback={<ErrorFallback />}>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes location={location} key={location.pathname}>
                            {/* Landing page - skip if user has completed signup */}
                            <Route path="/" element={
                                profile?.hasCompletedSignup
                                    ? <Navigate to="/dashboard" />
                                    : <Landing />
                            } />

                            {/* Onboarding flow - new users only */}
                            <Route path="/welcome" element={
                                profile?.hasCompletedSignup
                                    ? <Navigate to="/dashboard" />
                                    : <OnboardingWelcome />
                            } />
                            <Route path="/tutorial" element={<QuickTutorial />} />

                            {/* Main app routes */}
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/module/:moduleId" element={<ModuleView />} />
                            <Route path="/power-hour" element={<PowerHourChallenge />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/profile" element={<Profile />} />

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
            </AnimatePresence>
            {showBottomNav && <BottomNav />}
        </>
    );
}

function App() {
    const { profile, setProfile, isAuthenticated } = useUserStore();
    const [showSignup, setShowSignup] = useState(false);

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
                createdAt: profile?.createdAt || new Date().toISOString(),
                hasCompletedSignup: profile?.hasCompletedSignup ?? false,
                authMethod: profile?.authMethod,
                phoneNumber: profile?.phoneNumber,
                email: profile?.email,
                // Viral Referral System - Generate unique code
                referralCode: profile?.referralCode || generateReferralCode(telegramUser.first_name || telegramUser.username || 'user'),
                referredBy: profile?.referredBy,
                referralCount: profile?.referralCount || 0,
                referralXP: profile?.referralXP || 0,
            };

            setProfile(userProfile);
            triggerHaptic('success');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, setProfile]);

    // Check if we should show signup modal
    useEffect(() => {
        if (profile && !profile.hasCompletedSignup) {
            setShowSignup(true);
        }
    }, [profile]);

    return (
        <BrowserRouter>
            {showSignup && <SignUpModal onComplete={() => setShowSignup(false)} />}
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
