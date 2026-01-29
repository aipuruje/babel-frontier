/**
 * i18n Configuration for Multi-language Support
 * Supports: English, Uzbek (Latin), Russian
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { getTelegramUser } from '@/utils/telegram';

// Import translations
import en from './locales/en.json';
import uz from './locales/uz.json';
import ru from './locales/ru.json';

// Get Telegram user's language preference
const telegramUser = getTelegramUser();
const telegramLanguage = telegramUser?.language_code;

// Map Telegram language codes to our supported languages
const languageMap: Record<string, string> = {
    'en': 'en',
    'uz': 'uz',
    'ru': 'ru',
    'ru-RU': 'ru',
    'uz-UZ': 'uz',
};

const fallbackLanguage = telegramLanguage && languageMap[telegramLanguage]
    ? languageMap[telegramLanguage]
    : 'en';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            uz: { translation: uz },
            ru: { translation: ru },
        },
        lng: fallbackLanguage, // Default language from Telegram
        fallbackLng: 'en',
        debug: import.meta.env.DEV,

        interpolation: {
            escapeValue: false, // React already escapes
        },

        detection: {
            // Order of detection
            order: ['localStorage', 'navigator'],
            // Keys to cache language
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },
    });

export default i18n;

// Helper to get current language
export const getCurrentLanguage = () => i18n.language || fallbackLanguage;

// Helper to change language
export const changeLanguage = (lng: string) => {
    return i18n.changeLanguage(lng);
};

// Supported languages
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'uz', name: 'Uzbek', nativeName: 'O\'zbekcha' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
] as const;
