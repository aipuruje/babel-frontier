// Quest data loader - loads quests from the JSON pack

import type { Quest, Zone, RankInfo } from './types';

// Load the quest pack data
const loadQuestPack = async () => {
    const response = await fetch('/fantasy-archive-mvp-pack.json');
    const data = await response.json();
    return data;
};

interface QuestPackData {
    canon_quests?: Quest[];
    zones?: Zone[];
    design?: {
        progression?: {
            rankCurve?: RankInfo[];
        };
    };
}

let questPackCache: QuestPackData | null = null;

export const getQuestPack = async () => {
    if (!questPackCache) {
        questPackCache = await loadQuestPack();
    }
    return questPackCache;
};

export const getAllCanonQuests = async (): Promise<Quest[]> => {
    const pack = await getQuestPack();
    return pack?.canon_quests || [];
};

export const getQuestById = async (questId: string): Promise<Quest | undefined> => {
    const quests = await getAllCanonQuests();
    return quests.find((q: Quest) => q.id === questId);
};

export const getQuestsByZone = async (zoneId: string): Promise<Quest[]> => {
    const quests = await getAllCanonQuests();
    return quests.filter((q: Quest) => q.zone === zoneId);
};

export const getAllZones = async (): Promise<Zone[]> => {
    const pack = await getQuestPack();
    return pack?.zones || [];
};

export const getZoneById = async (zoneId: string): Promise<Zone | undefined> => {
    const zones = await getAllZones();
    return zones.find((z: Zone) => z.id === zoneId);
};

export const getRankProgression = async (): Promise<RankInfo[]> => {
    const pack = await getQuestPack();
    return pack?.design?.progression?.rankCurve || [];
};

export const getRankForXP = async (xp: number): Promise<RankInfo> => {
    const ranks = await getRankProgression();

    // Find the highest rank where xpRequired <= player's xp
    let currentRank = ranks[0];
    for (const rank of ranks) {
        if (rank.xpRequired <= xp) {
            currentRank = rank;
        } else {
            break;
        }
    }

    return currentRank;
};

export const getNextRank = async (currentRank: number): Promise<RankInfo | null> => {
    const ranks = await getRankProgression();
    return ranks.find((r: RankInfo) => r.rank === currentRank + 1) || null;
};

export const getAvailableZonesForRank = async (playerRank: number): Promise<Zone[]> => {
    const zones = await getAllZones();
    return zones.filter((z: Zone) => z.unlockRank <= playerRank);
};
