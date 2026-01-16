/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TELEGRAM_BOT_TOKEN: string;
    readonly VITE_TELEGRAM_BOT_USERNAME: string;
    readonly VITE_API_BASE_URL: string;
    readonly VITE_CLOUDFLARE_ACCOUNT_ID: string;
    readonly VITE_ENV: string;
    readonly VITE_ENABLE_AI_TUTOR: string;
    readonly VITE_ENABLE_VOICE_INPUT: string;
    readonly VITE_ENABLE_CLANS: string;
    readonly VITE_ENABLE_ANALYTICS: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
