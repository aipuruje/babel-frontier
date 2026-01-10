// Updated player state with backend integration

import { useState, useEffect } from 'react';
import type { PlayerState } from './types';
import { getRankForXP } from './questData';
import apiClient from './apiClient';

const STORAGE_KEY = 'archive_player_state';

// Default player state
const defaultPlayerState: PlayerState = {
    userId: 'demo_player',
    rank: 0,
    xp: 0,
    streak: 0,
    fatigue: 0,
    mastery: {
        reading: 0,
        listening: 0,
        grammar: 0,
        writing: 0,
        speaking: 0,
    },
    errorFingerprint: [],
    cooldowns: [],
    inventory: {
        shards: 0,
        items: [],
    },
};

export const loadPlayerState = (): PlayerState => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse player state:', e);
        }
    }
    return { ...defaultPlayerState };
};

export const savePlayerState = (state: PlayerState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

// Sync player state from backend
export const syncPlayerStateFromBackend = async (): Promise<PlayerState | null> => {
    if (!apiClient.isAuthenticated()) {
        // Auto-authenticate with mock credentials for MVP
        await apiClient.authMock();
    }

    const response = await apiClient.getMe();

    if (response.ok && response.data) {
        // Type guard: cast backend player to expected shape
        const backendPlayer = response.data.player as {
            userId: string;
            rank?: number;
            xp?: number;
            streak?: number;
            fatigue?: number;
            mastery?: {
                reading: number;
                listening: number;
                grammar: number;
                writing: number;
                speaking: number;
            };
            errorFingerprint?: Array<{ tag: string; weight: number }>;
        };

        // CRITICAL: Load existing local state to preserve local-only data
        const existingState = loadPlayerState();

        // Convert backend format to frontend format
        // MERGE strategy: Take XP/Rank/Mastery from backend, preserve local-only fields
        const playerState: PlayerState = {
            userId: backendPlayer.userId,
            rank: backendPlayer.rank || 0,
            xp: backendPlayer.xp || 0,
            streak: backendPlayer.streak || 0,
            fatigue: backendPlayer.fatigue || 0,

            // PRESERVE local-only data (not yet tracked by backend)
            shards: existingState.shards || 0,
            questsCompleted: existingState.questsCompleted || 0,

            mastery: backendPlayer.mastery || {
                reading: 0,
                listening: 0,
                grammar: 0,
                writing: 0,
                speaking: 0,
            },
            errorFingerprint: backendPlayer.errorFingerprint || [],
            cooldowns: [],

            // PRESERVE local inventory (not yet tracked by backend)
            inventory: existingState.inventory || {
                shards: 0,
                items: [],
            },
        };

        // Sync shards shorthand with inventory
        playerState.shards = playerState.inventory.shards;

        savePlayerState(playerState);
        return playerState;
    }

    return null;
};

export const updatePlayerXP = async (currentState: PlayerState, xpGain: number): Promise<PlayerState> => {
    const newXP = currentState.xp + xpGain;
    const newRank = await getRankForXP(newXP);

    const updated = {
        ...currentState,
        xp: newXP,
        rank: newRank.rank,
    };

    savePlayerState(updated);
    return updated;
};

export const updatePlayerMastery = (
    currentState: PlayerState,
    skill: keyof PlayerState['mastery'],
    delta: number
): PlayerState => {
    const currentValue = currentState.mastery[skill];
    const newValue = Math.max(0, Math.min(1, currentValue + delta));

    const updated = {
        ...currentState,
        mastery: {
            ...currentState.mastery,
            [skill]: newValue,
        },
    };

    savePlayerState(updated);
    return updated;
};

export const addPlayerShards = (currentState: PlayerState, shards: number): PlayerState => {
    const newShardCount = currentState.inventory.shards + shards;
    const updated = {
        ...currentState,
        shards: newShardCount, // Update shorthand
        inventory: {
            ...currentState.inventory,
            shards: newShardCount,
        },
    };

    savePlayerState(updated);
    return updated;
};

export const addPlayerItem = (currentState: PlayerState, itemId: string, qty: number = 1): PlayerState => {
    const existingItem = currentState.inventory.items.find(i => i.itemId === itemId);

    let items;
    if (existingItem) {
        items = currentState.inventory.items.map(i =>
            i.itemId === itemId ? { ...i, qty: i.qty + qty } : i
        );
    } else {
        items = [...currentState.inventory.items, { itemId, qty }];
    }

    const updated = {
        ...currentState,
        inventory: {
            ...currentState.inventory,
            items,
        },
    };

    savePlayerState(updated);
    return updated;
};

// React hook for player state with backend sync
export const usePlayerState = () => {
    const [playerState, setPlayerState] = useState<PlayerState>(loadPlayerState);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync from backend on mount
    useEffect(() => {
        const syncFromBackend = async () => {
            setLoading(true);
            try {
                const backendState = await syncPlayerStateFromBackend();
                if (backendState) {
                    setPlayerState(backendState);
                }
            } catch (err) {
                console.error('Failed to sync player state:', err);
                setError('Failed to load player data');
            } finally {
                setLoading(false);
            }
        };

        syncFromBackend();
    }, []);

    useEffect(() => {
        const handleStorageChange = () => {
            setPlayerState(loadPlayerState());
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const updateXP = async (xpGain: number) => {
        const updated = await updatePlayerXP(playerState, xpGain);
        setPlayerState(updated);
    };

    const updateMastery = (skill: keyof PlayerState['mastery'], delta: number) => {
        const updated = updatePlayerMastery(playerState, skill, delta);
        setPlayerState(updated);
    };

    const addShards = (amount: number) => {
        const updated = addPlayerShards(playerState, amount);
        setPlayerState(updated);
    };

    const addItem = (itemId: string, qty: number = 1) => {
        const updated = addPlayerItem(playerState, itemId, qty);
        setPlayerState(updated);
    };

    const syncFromBackend = async () => {
        setLoading(true);
        try {
            const backendState = await syncPlayerStateFromBackend();
            if (backendState) {
                setPlayerState(backendState);
            }
        } catch (err) {
            console.error('Sync error:', err);
            setError('Failed  to sync player data');
        } finally {
            setLoading(false);
        }
    };

    return {
        playerState,
        loading,
        error,
        updateXP,
        updateMastery,
        addShards,
        addItem,
        refreshState: () => setPlayerState(loadPlayerState()),
        syncFromBackend,
    };
};
