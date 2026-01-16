export interface Env {
    DB: D1Database;
    SESSIONS: KVNamespace;
    TELEGRAM_BOT_TOKEN: string;
}

export interface User {
    id: number;
    telegram_id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
    language_code: string;
    is_premium: boolean;
    created_at: string;
    last_active: string;
}

export interface UserProgress {
    id: number;
    user_id: number;
    module_id: string;
    xp: number;
    progress: number;
    mastery_level: number;
    completed: boolean;
    first_started: string;
    last_practiced: string;
}

export interface PracticeAttempt {
    id: number;
    user_id: number;
    module_id: string;
    passage_id?: number;
    questions_total: number;
    questions_correct: number;
    time_spent: number;
    xp_earned: number;
    completed_at: string;
}

export interface AnalyticsEvent {
    id: number;
    user_id: number;
    event_type: string;
    event_data?: string;
    created_at: string;
}

export interface UserStreak {
    id: number;
    user_id: number;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string;
}
