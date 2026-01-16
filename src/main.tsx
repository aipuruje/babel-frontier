import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@/styles/global.css';
import { initTelegramWebApp } from '@/utils/telegram';

// Initialize Telegram WebApp on startup
const telegram = initTelegramWebApp();

// Log environment info
console.log('Environment:', {
    isDevelopment: import.meta.env.DEV,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    telegramAvailable: !!telegram
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
