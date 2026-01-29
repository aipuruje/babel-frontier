// Telegram WebApp types
export interface TelegramWebApp {
    initData: string;
    initDataUnsafe: {
        user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
        };
        chat_instance?: string;
        auth_date: number;
        hash: string;
    };
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: {
        bg_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
    };
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    MainButton: {
        text: string;
        color: string;
        textColor: string;
        isVisible: boolean;
        isActive: boolean;
        isProgressVisible: boolean;
        setText: (text: string) => void;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
        show: () => void;
        hide: () => void;
        enable: () => void;
        disable: () => void;
        showProgress: (leaveActive?: boolean) => void;
        hideProgress: () => void;
    };
    BackButton: {
        isVisible: boolean;
        onClick: (callback: () => void) => void;
        offClick: (callback: () => void) => void;
        show: () => void;
        hide: () => void;
    };
    HapticFeedback: {
        impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
        notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
        selectionChanged: () => void;
    };
    ready: () => void;
    expand: () => void;
    close: () => void;
    enableClosingConfirmation: () => void;
    disableClosingConfirmation: () => void;
    showPopup: (params: {
        title?: string;
        message: string;
        buttons?: Array<{ type?: string; text?: string }>;
    }, callback?: (buttonId: string) => void) => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
    openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
    openTelegramLink: (url: string) => void;
    openInvoice?: (url: string, callback?: (status: string) => void) => void;
    sendData: (data: string) => void;
}

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}

// Learning Module Types
export interface Module {
    id: string;
    name: string;
    description: string;
    icon: string;
    painPoint: string;
    duration: number; // minutes
    xpReward: number;
    isLocked: boolean;
    progress: number; // 0-100
    masteryLevel: number; // 0-100
    order: number;
    estimatedTime: {
        theory: number;      // minutes
        practice: number;    // minutes
        battle: number;      // minutes
        total: number;       // minutes
    };
}

export interface Question {
    id: string;
    moduleId: string;
    passage: string;
    question: string;
    type: 'TFNG' | 'YNNG' | 'MCQ' | 'Matching' | 'Completion' | 'Heading';
    options?: string[];
    correctAnswer: string;
    explanation: string;
    difficulty: 1 | 2 | 3 | 4 | 5;
    paraphraseLevel?: 1 | 2 | 3 | 4 | 5;
    timeLimit?: number; // seconds
    keywords?: string[];
}

export interface UserAnswer {
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timeTaken: number; // seconds
    timestamp: string;
}

// User Progress Types
export interface UserProfile {
    id: string;
    telegramId: number;
    username: string;
    firstName: string;
    xp: number;
    level: number;
    currentBand: number; // 0-9 with decimals
    streakDays: number;
    lastActive: string;
    createdAt: string;
    targetBand?: number;
    examDate?: string;
    // Sign-up fields
    hasCompletedSignup?: boolean;
    authMethod?: 'phone' | 'email';
    phoneNumber?: string;
    email?: string;
    // Viral Referral System
    referralCode?: string; // Unique code for sharing (e.g., "AMR-K7X2P9")
    referredBy?: string; // Who invited this user (referral code)
    referralCount?: number; // Number of successful referrals
    referralXP?: number; // Bonus XP from referrals (100 XP per friend)
    // Subscription & Monetization
    subscriptionTier?: 'free' | 'premium' | 'lifetime'; // Current plan
    isPremium?: boolean; // Has active premium subscription
    isLifetime?: boolean; // Has lifetime access
    subscriptionExpiry?: string; // When premium expires (ISO date)
    battleModeAttemptsToday?: number; // Track daily Battle Mode usage
    lastBattleModeReset?: string; // Last reset date for daily limit
}

export interface ModuleProgress {
    moduleId: string;
    accuracy: number; // 0-100
    timeSpent: number; // minutes
    questionsCompleted: number;
    masteryLevel: number; // 0-100
    lastAttempt: string;
    version?: number; // For conflict resolution in multi-device sync
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    xpReward: number;
    unlockedAt?: string;
    progress?: number; // 0-100 for progressive achievements
    requirement?: string;
}

// Gamification Types
export interface DailyChallenge {
    id: string;
    title: string;
    description: string;
    type: 'accuracy' | 'speed' | 'streak' | 'mastery';
    target: number;
    progress: number;
    xpReward: number;
    expiresAt: string;
    completed: boolean;
}

export interface Clan {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    totalXP: number;
    rank: number;
    createdAt: string;
    createdBy: string;
}

export interface ClanMember {
    userId: string;
    username: string;
    xp: number;
    level: number;
    role: 'leader' | 'officer' | 'member';
    joinedAt: string;
}

// Analytics Types
export interface PerformanceMetrics {
    overallBandScore: number;
    predictionDate: string;
    accuracyByType: {
        [key in Question['type']]: number;
    };
    readingSpeed: number; // WPM
    avgTimePerPassage: number; // minutes
    vocabularyMastery: number; // 0-500
    weaknessHeatmap: number[][]; // 9x9 grid
    studyStreak: number[];
}

export interface WeaknessReport {
    moduleId: string;
    moduleName: string;
    score: number; // 0-100
    errorCount: number;
    commonErrors: string[];
    recommendation: string;
}

// API Response Types
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// State Management Types (Zustand)
export interface UserStore {
    profile: UserProfile | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    focusStats: FocusStats;
    preferences: UserPreferences;
    currentSession: FocusSession | null;
    setProfile: (profile: UserProfile) => void;
    updateXP: (xpGain: number) => void;
    incrementStreak: () => void;
    completeSignup: (method: 'phone' | 'email', value: string) => void;
    startFocusSession: (moduleId?: string) => void;
    endFocusSession: () => void;
    addBreakToSession: () => void;
    updatePreferences: (prefs: Partial<UserPreferences>) => void;
    logout: () => void;
}

export interface ModuleStore {
    modules: Module[];
    currentModule: Module | null;
    progress: Record<string, ModuleProgress>;
    setModules: (modules: Module[]) => void;
    selectModule: (moduleId: string) => void;
    updateProgress: (moduleId: string, progress: Partial<ModuleProgress>) => void;
    unlockNextModule: () => void;
}

export interface QuestionStore {
    questions: Question[];
    currentQuestion: Question | null;
    answers: UserAnswer[];
    currentQuestionIndex: number;
    isLoading: boolean;
    loadQuestions: (moduleId: string) => Promise<void>;
    submitAnswer: (answer: string, timeTaken: number) => void;
    nextQuestion: () => void;
    resetSession: () => void;
}

export interface GamificationStore {
    achievements: Achievement[];
    dailyChallenges: DailyChallenge[];
    clan: Clan | null;
    unlockedAchievements: string[];
    unlockAchievement: (achievementId: string) => void;
    updateChallengeProgress: (challengeId: string, progress: number) => void;
    joinClan: (clan: Clan) => void;
    leaveClan: () => void;
}

// Focus Session Types
export interface FocusSession {
    id: string;
    startTime: string;
    endTime?: string;
    duration: number;        // minutes
    moduleId?: string;
    breaksTaken: number;
    completed: boolean;
}

export interface FocusStats {
    totalFocusTime: number;     // minutes, all time
    weeklyFocusTime: number[];  // minutes, last 7 days [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
    longestStreak: number;      // consecutive days
    currentStreak: number;      // consecutive days
    sessionsCompleted: number;
    powerHoursCompleted: number;
    lastSessionDate?: string;   // ISO date string
}

export interface UserPreferences {
    breakRemindersEnabled: boolean;
    breakReminderInterval: number;  // minutes (10-60)
    focusModeEnabled: boolean;
    soundEffectsEnabled: boolean;
}

// Utility Types
export type QuestionType = Question['type'];
export type AchievementRarity = Achievement['rarity'];
export type ClanRole = ClanMember['role'];
