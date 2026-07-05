import type { RankGameSeason, RankHistory } from '../../types/dtos/PlayerDTO';

import { STICKY_CDN_DOMAIN } from '../env';

export interface RankTier {
    name: string;
    tiers: number;
    levels: number[];
}

export interface RankDetails {
    rank: string;
    tier: string;
    color: string;
    image: string;
}

export interface RankHistoryDataPoint {
    date: string;
    realDate: Date;
    level: number;
    rank: string;
    tier: string;
    color: string;
    score: number;
    image: string;
}

const RANK_COLORS = [
    '#A7693F', // Bronze
    '#7B9196', // Silver
    '#FFDA57', // Gold
    '#58E1E8', // Platinum
    '#1680FF', // Diamond
    '#EB46FF', // Grandmaster
    '#FE5A1D', // Celestial
    '#FF4F4D', // Eternity
    '#FF4F4D' // One Above All
];

const rankedImages = [
    'bronze.png',
    'silver.png',
    'gold.png',
    'platinum.png',
    'diamond.png',
    'grandmaster.png',
    'celestial.png',
    'eternity.png',
    'one_above_all.png'
];

const RANKS: RankTier[] = [
    {
        name: 'Bronze',
        tiers: 3,
        levels: [1, 2, 3]
    },
    {
        name: 'Silver',
        tiers: 3,
        levels: [4, 5, 6]
    },
    {
        name: 'Gold',
        tiers: 3,
        levels: [7, 8, 9]
    },
    {
        name: 'Platinum',
        tiers: 3,
        levels: [10, 11, 12]
    },
    {
        name: 'Diamond',
        tiers: 3,
        levels: [13, 14, 15]
    },
    {
        name: 'Grandmaster',
        tiers: 3,
        levels: [16, 17, 18]
    },
    {
        name: 'Celestial',
        tiers: 3,
        levels: [19, 20, 21]
    },
    {
        name: 'Eternity',
        tiers: 1,
        levels: [22]
    },
    {
        name: 'One Above All',
        tiers: 1,
        levels: [23]
    }
];

function romanToInt(roman: string): number {
    const romanMap: Record<string, number> = {
        I: 1,
        V: 5,
        X: 10,
        L: 50,
        C: 100,
        D: 500,
        M: 1_000
    };
    let prevValue = 0,
        total = 0;

    for (let i = roman.length - 1; i >= 0; i--) {
        const current = romanMap[roman[i].toUpperCase()];
        if (!current) {
            return NaN;
        }
        total = current < prevValue
            ? total - current
            : total + current;
        prevValue = current;
    }
    return total;
}

export function getLevelFromRank(rankString: string): undefined | number {
    const trimmed = rankString.trim();

    // Caso 1: Rangos de un solo tier sin número (ej: "Eternity")
    const matchedRank = RANKS.find((rt) => rt.name.toLowerCase() === trimmed.toLowerCase() && rt.tiers === 1);
    if (matchedRank) {
        return matchedRank.levels.at(0);
    }

    // Caso 2: Rangos con tier explícito (arábigo o romano)
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
        return undefined;
    }
    const tierPart = parts.pop()!;
    const tier = Number.isNaN(Number(tierPart))
        ? romanToInt(tierPart.toUpperCase())
        : parseInt(tierPart, 10);

    if (Number.isNaN(tier)) {
        return undefined;
    }

    const name = parts.join(' ');
    const rankTier = RANKS.find((rt) => rt.name.toLowerCase() === name.toLowerCase());

    // Validación final
    if (!rankTier || tier < 1 || tier > rankTier.tiers) {
        return undefined;
    }
    return rankTier.levels[tier - 1];
}

export function getRankDetails(level: number): RankDetails {
    const rank = RANKS.find((r) => r.levels.includes(level));
    if (!rank) {
        return {
            rank: 'Unranked',
            tier: '',
            color: '#000000',
            image: ''
        };
    }

    const rankIndex = RANKS.indexOf(rank);
    const tierPosition = rank.levels.length - 1 - rank.levels.indexOf(level);
    const tierNumber = ['I', 'II', 'III'][tierPosition] || '';

    return {
        rank: rank.name,
        tier: tierNumber,
        color: RANK_COLORS[rankIndex],
        image: `${STICKY_CDN_DOMAIN}/ranks/${rankedImages[rankIndex]}`
    };
}

export function getCurrentAndPeakRank(rankGameSeason: Record<string, RankGameSeason>) {
    const sortedSeasons = Object.entries(rankGameSeason)
        .sort(([keyA], [keyB]) => parseInt(keyA, 10) - parseInt(keyB, 10));

    let currentLevel = 0;
    let peakLevel = 0;

    sortedSeasons.forEach(([_, seasonData]) => {
        currentLevel = seasonData.level;
        peakLevel = Math.max(peakLevel, seasonData.max_level);
    });

    return {
        currentRank: getRankDetails(currentLevel),
        peakRank: getRankDetails(peakLevel)
    };
}

export function processRankHistory(history: RankHistory[]): RankHistoryDataPoint[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return history
        .sort((a, b) => a.match_time_stamp - b.match_time_stamp)
        .map((entry) => {
            const date = new Date(entry.match_time_stamp * 1_000);
            const rankDetails = getRankDetails(entry.level_progression.to);

            return {
                date: `${months[date.getMonth()]} ${date.getDate()}`,
                realDate: date,
                level: entry.level_progression.to,
                rank: rankDetails.rank,
                tier: rankDetails.tier,
                color: rankDetails.color,
                score: entry.score_progression.total_score,
                image: rankDetails.image
            };
        });
}
