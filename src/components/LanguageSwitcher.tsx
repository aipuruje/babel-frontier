/**
 * Language Switcher Component
 * Allows users to change app language
 */

import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES, changeLanguage, getCurrentLanguage } from '@/i18n/config';
import { triggerHaptic } from '@/utils/telegram';
import './LanguageSwitcher.css';

interface LanguageSwitcherProps {
    variant?: 'button' | 'inline';
}

export default function LanguageSwitcher({ variant = 'button' }: LanguageSwitcherProps) {
    const [showMenu, setShowMenu] = useState(false);
    const currentLang = getCurrentLanguage();

    const handleLanguageChange = async (langCode: string) => {
        try {
            await changeLanguage(langCode);
            triggerHaptic('success');
            setShowMenu(false);
        } catch (error) {
            console.error('Failed to change language:', error);
            triggerHaptic('error');
        }
    };

    const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === currentLang)
        || SUPPORTED_LANGUAGES[0];

    if (variant === 'inline') {
        return (
            <div className="language-inline">
                {SUPPORTED_LANGUAGES.map(lang => (
                    <button
                        key={lang.code}
                        className={`language-option ${currentLang === lang.code ? 'active' : ''}`}
                        onClick={() => handleLanguageChange(lang.code)}
                    >
                        {currentLang === lang.code && <Check size={16} />}
                        <span>{lang.nativeName}</span>
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className="language-switcher">
            <button
                className="language-toggle"
                onClick={() => {
                    setShowMenu(!showMenu);
                    triggerHaptic('selection');
                }}
            >
                <Globe size={20} />
                <span>{currentLanguage.nativeName}</span>
            </button>

            {showMenu && (
                <>
                    <div
                        className="language-overlay"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="language-menu">
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                className={`language-menu-item ${currentLang === lang.code ? 'active' : ''}`}
                                onClick={() => handleLanguageChange(lang.code)}
                            >
                                <div className="lang-info">
                                    <span className="lang-native">{lang.nativeName}</span>
                                    <span className="lang-name">{lang.name}</span>
                                </div>
                                {currentLang === lang.code && (
                                    <Check size={20} className="lang-check" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
