import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/global.css';
import '@/styles/device-optimizations.css';
import { initTelegramWebApp, setupTelegramViewport } from '@/utils/telegram';
import { initializeServiceWorker } from '@/utils/serviceWorker';
import { detectDeviceCapabilities, applyDeviceOptimizations, monitorPerformance, logPerformance } from '@/utils/deviceCapabilities';
import { initAnalytics } from '@/utils/analytics';
import { initErrorTracking } from '@/utils/errorTracking';
import './i18n/config'; // Initialize i18n

// Initialize analytics and error tracking
initAnalytics();
initErrorTracking();

// Initialize Telegram WebApp on startup
const telegram = initTelegramWebApp();

// Setup Telegram viewport handling
setupTelegramViewport();

// Initialize Service Worker for offline support
initializeServiceWorker();

// Detect device capabilities and apply optimizations
const deviceCapabilities = detectDeviceCapabilities();
applyDeviceOptimizations(deviceCapabilities);

// Monitor performance metrics
monitorPerformance((metrics) => {
    if (import.meta.env.DEV) {
        logPerformance(metrics);
    }

    // Send to analytics in production
    // analytics.track('performance', metrics);
});

// Log environment info
console.log('Environment:', {
    isDevelopment: import.meta.env.DEV,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    telegramAvailable: !!telegram,
    deviceTier: deviceCapabilities.isLowEnd ? 'low' : deviceCapabilities.isMidRange ? 'mid' : 'high',
    connection: deviceCapabilities.connection,
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
