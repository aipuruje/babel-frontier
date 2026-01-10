// Type definitions for Archive of Tongues

export interface MultiLangText {
    en: string;
    uz: string;
    ru: string;
}

export type QuestTemplate = 'RUNE_SCAN' | 'ECHO_HUNT' | 'SPELL_FORGE' | 'TRADE_PACT' | 'GATE_SPEAK';
export type TaskType = 'MCQ' | 'CLOZE' | 'MATCH' | 'SHORT_TEXT' | 'SPEAK' | 'LISTEN_MCQ' | 'LISTEN_CLOZE' | 'READ_MCQ' | 'READ_MATCH';
export type EnemyArchetype = 'SENTINEL' | 'SHADE' | 'WRAITH' | 'GOLEM' | 'DRAGONLING';
export type Locale = 'en' | 'uz' | 'ru';

export interface Quest {
    id: string;
    zone: string;
    template: QuestTemplate;
    difficulty: number;
    canon?: boolean;
    story: {
        title: MultiLangText;
        summary: MultiLangText;
        npc: string;
        cutscene_key?: string;
        lore_unlock?: string;
    };
    tasks: Task[];
    battle: BattleConfig;
    rewards: Rewards;
    antiLeak: AntiLeak;
}

export interface Task {
    id: string;
    type: TaskType;
    prompt: MultiLangText;
    media?: {
        audio_r2_key?: string;
        image_r2_key?: string;
    };
    choices?: Choice[];
    expected: Record<string, unknown>;
    scoring: {
        maxPoints: number;
        partial: boolean;
        tags: string[];
    };
    supportsLocales: Locale[];
}

export interface Choice {
    id: string;
    text: MultiLangText;
}

export interface BattleConfig {
    enemy: {
        name: MultiLangText;
        archetype: EnemyArchetype;
        introLine: MultiLangText;
    };
    playerHP: number;
    enemyHP: number;
    timeLimitSec: number;
    attackPerCorrect: number;
    damagePerWrong: number;
}

export interface Rewards {
    xp: number;
    shards: number;
    items: string[];
    badgeKey: string;
}

export interface AntiLeak {
    forbiddenTerms: string[];
    uiNeverShow: string[];
}

export interface PlayerState {
    userId: string;
    rank: number;
    xp: number;
    streak: number;
    fatigue: number;
    shards?: number; // Shorthand for inventory.shards
    questsCompleted?: number; // Total completed quests
    mastery: {
        reading: number;
        listening: number;
        grammar: number;
        writing: number;
        speaking: number;
    };
    errorFingerprint: Array<{
        tag: string;
        weight: number;
    }>;
    cooldowns: Array<{
        type: string;
        endsAt: string;
    }>;
    inventory: {
        shards: number;
        items: Array<{
            itemId: string;
            qty: number;
        }>;
    };
}

export interface BattleState {
    questId: string;
    currentTaskIndex: number;
    playerHP: number;
    enemyHP: number;
    timeRemaining: number;
    answers: Array<{
        taskId: string;
        answer: unknown;
        isCorrect: boolean;
    }>;
    status: 'active' | 'victory' | 'defeat' | 'timeout';
}

export interface BattleResult {
    victory: boolean;
    rewards?: {
        xp: number;
        shards: number;
        items: string[];
        badges: string[];
    };
    playerState: PlayerState;
}

export interface Zone {
    id: string;
    title: MultiLangText;
    theme: string;
    unlockRank: number;
    canonQuestIds: string[];
}

export interface RankInfo {
    rank: number;
    name: MultiLangText;
    xpRequired: number;
}
