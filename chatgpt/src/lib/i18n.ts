// i18n configuration for multi-language support

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
    en: {
        translation: {
            // Navigation
            'nav.zones': 'Zones',
            'nav.profile': 'Profile',
            'nav.inventory': 'Inventory',
            'nav.leaderboard': 'Leaderboard',

            // Dashboard
            'dashboard.rank': 'Rank',
            'dashboard.xp': 'Experience',
            'dashboard.streak': 'Streak',
            'dashboard.shards': 'Rune Shards',
            'dashboard.mastery': 'Mastery',

            // Battle
            'battle.begin': 'Begin Battle',
            'battle.playerHP': 'Your HP',
            'battle.enemyHP': 'Enemy HP',
            'battle.timeRemaining': 'Time Remaining',
            'battle.victory': 'Victory!',
            'battle.defeat': 'Defeated',

            // Quests
            'quest.difficulty': 'Difficulty',
            'quest.rewards': 'Rewards',
            'quest.locked': 'Locked',

            // Common
            'common.loading': 'Loading...',
            'common.submit': 'Submit',
            'common.cancel': 'Cancel',
            'common.continue': 'Continue',
        },
    },
    uz: {
        translation: {
            // Navigation
            'nav.zones': 'Zonerlar',
            'nav.profile': 'Profil',
            'nav.inventory': 'Inventar',
            'nav.leaderboard': 'Reyting',

            // Dashboard
            'dashboard.rank': 'Daraja',
            'dashboard.xp': 'Tajriba',
            'dashboard.streak': 'Ketma-ketlik',
            'dashboard.shards': 'Rune Bo\'laklari',
            'dashboard.mastery': 'Mahorat',

            // Battle
            'battle.begin': 'Jangni Boshlash',
            'battle.playerHP': 'Sizning HP',
            'battle.enemyHP': 'Dushman HP',
            'battle.timeRemaining': 'Qolgan Vaqt',
            'battle.victory': 'G\'alaba!',
            'battle.defeat': 'Mag\'lubiyat',

            // Quests
            'quest.difficulty': 'Qiyinchilik',
            'quest.rewards': 'Mukofotlar',
            'quest.locked': 'Yopiq',

            // Common
            'common.loading': 'Yuklanmoqda...',
            'common.submit': 'Yuborish',
            'common.cancel': 'Bekor qilish',
            'common.continue': 'Davom etish',
        },
    },
    ru: {
        translation: {
            // Navigation
            'nav.zones': 'Зоны',
            'nav.profile': 'Профиль',
            'nav.inventory': 'Инвентарь',
            'nav.leaderboard': 'Рейтинг',

            // Dashboard
            'dashboard.rank': 'Ранг',
            'dashboard.xp': 'Опыт',
            'dashboard.streak': 'Серия',
            'dashboard.shards': 'Осколки Рун',
            'dashboard.mastery': 'Мастерство',

            // Battle
            'battle.begin': 'Начать Битву',
            'battle.playerHP': 'Ваше HP',
            'battle.enemyHP': 'HP Врага',
            'battle.timeRemaining': 'Осталось Времени',
            'battle.victory': 'Победа!',
            'battle.defeat': 'Поражение',

            // Quests
            'quest.difficulty': 'Сложность',
            'quest.rewards': 'Награды',
            'quest.locked': 'Заблокировано',

            // Common
            'common.loading': 'Загрузка...',
            'common.submit': 'Отправить',
            'common.cancel': 'Отмена',
            'common.continue': 'Продолжить',
        },
    },
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: 'en', // default language
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;

export const setLanguage = (lang: 'en' | 'uz' | 'ru') => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
};

export const getLanguage = (): 'en' | 'uz' | 'ru' => {
    const saved = localStorage.getItem('language');
    return (saved as 'en' | 'uz' | 'ru') || 'en';
};
