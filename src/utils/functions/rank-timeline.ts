import { MARVELRIVALS_DOMAIN } from '../env';

export const rankedImages: string[] = [
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

export const rankedColors: string[] = [
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

export function getRank(level: number): RankInfo {
    const ranks: {
        name: string;
        levels: number[];
    }[] = [
            {
                name: 'Bronze',
                levels: [1, 2, 3]
            },
            {
                name: 'Silver',
                levels: [4, 5, 6]
            },
            {
                name: 'Gold',
                levels: [7, 8, 9]
            },
            {
                name: 'Platinum',
                levels: [10, 11, 12]
            },
            {
                name: 'Diamond',
                levels: [13, 14, 15]
            },
            {
                name: 'Grandmaster',
                levels: [16, 17, 18]
            },
            {
                name: 'Celestial',
                levels: [19, 20, 21]
            },
            {
                name: 'Eternity',
                levels: [22]
            },
            {
                name: 'One Above All',
                levels: [23]
            }
        ];

    const tiers: Record<number, string> = {
        0: 'III',
        1: 'II',
        2: 'I'
    };

    for (let i = 0; i < ranks.length; i++) {
        const { name, levels } = ranks[i];
        if (levels.includes(level)) {
            if (name === 'Eternity' || name === 'One Above All') {
                return {
                    rank: name,
                    color: rankedColors[i],
                    image: rankedImages[i],
                    imageURL: `${MARVELRIVALS_DOMAIN}/rivals/ranked/${rankedImages[i]}`
                };
            }
            const tierIndex = (level - levels[0]) % 3;
            const tier = tiers[tierIndex];
            return {
                rank: `${name} ${tier}`,
                color: rankedColors[i],
                image: rankedImages[i],
                imageURL: `${MARVELRIVALS_DOMAIN}/rivals/ranked/${rankedImages[i]}`
            };
        }
    }

    throw new Error('Invalid rank level');
}

export interface RankHistoryEntry {
    match_time_stamp: number;
    level_progression: {
        from: number;
        to: number;
    };
    score_progression: {
        add_score: number;
        total_score: number;
    };
}

export interface TimelineEntry {
    timestamp: number;
    lastRank: string;
    newRank: string;
    totalScore: number;
}

export interface RankInfo {
    rank: string;
    color: string;
    image: string;
    imageURL: string;
}
