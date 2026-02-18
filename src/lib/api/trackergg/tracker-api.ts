import type { HeroesRanked, PlayerDTO } from '../../../types/dtos/PlayerDTO';
import type { Welcome as TrackerHeroesMetadata } from './dto/HeroDTO';
import type { HeroesDTO } from '../../../types/dtos/HeroesDTO';
import type { CareerDTO, Datum } from './dto/CareerDTO';
import type { Profile } from './dto/ProfileDTO';

import { AttackType, Role } from '../../../types/dtos/HeroesDTO';

export type TrackerGameModes = 'competitive' | 'quick-match' | 'all'; // todo: ver si vale la pena agregar modos arcade y todo eso
export const trackerModesMap: Record<
  'ranked' | 'casual' | 'both',
  TrackerGameModes
> = {
  ranked: 'competitive',
  casual: 'quick-match',
  both: 'all'
};

/**
 * Transforms Tracker.gg career API response data to PlayerDTO format.
 * Uses Profile data to complete missing information like level, avatar, etc.
 *
 * Career URL: https://api.tracker.gg/api/v2/marvel-rivals/standard/profile/ign/{name}/segments/career?mode=all
 * Profile URL: https://api.tracker.gg/api/v2/marvel-rivals/standard/profile/ign/{name}
 */
export function transformCareerToPlayerDTO(
  careerData: CareerDTO,
  profileData: Profile,
  playerUid: number
): PlayerDTO {
  const { platformInfo, metadata } = profileData.data;

  const playerName = platformInfo.platformUserHandle;
  const playerLevel = metadata.level.toString();
  const avatarUrl = platformInfo.avatarUrl;

  const iconIdMatch = /\/(\d+)\.jpg/.exec(avatarUrl);
  const playerIconId = iconIdMatch
? iconIdMatch[1]
: '0';

  // Use career data for all stats and heroes (career endpoint has complete data)
  const overview = careerData.data.find((item) => item.type === 'overview');
  const heroSegments = careerData.data.filter((item) => item.type === 'hero');

  if (!overview) {
    throw new Error('Overview data not found in Career response');
  }

  // Overall career stats
  const stats = overview.stats;
  const totalKills = Number(stats.kills?.value) || 0;
  const totalDeaths = Number(stats.deaths?.value) || 0;
  const totalAssists = Number(stats.assists?.value) || 0;
  const totalWins = Number(stats.matchesWon?.value) || 0;
  const totalMatches = Number(stats.matchesPlayed?.value) || 0;
  const totalTimePlayedDispley = stats.timePlayed?.displayValue;
  const totalTimePlayedValue = Number(stats.timePlayed?.value) || 0;
  const totalMvp = Number(stats.totalMvp?.value) || 0;
  const totalSvp = Number(stats.totalSvp?.value) || 0;

  // Rank information from career
  const rankedStat = stats.ranked;
  const rankTier = rankedStat?.metadata.tierName || 'Unranked';
  const rankScore = Number(rankedStat?.value) || 0;
  const rankColor = rankedStat?.metadata.color ?? null;
  const rankIcon = rankedStat?.metadata.iconUrl ?? null;

  const lifetimePeakStat = stats.lifetimePeakRanked;

  // Map heroes from career data (uses CareerDTO Datum structure)
  const heroes: HeroesRanked[] = heroSegments.map((heroSegment) => transformHeroDataFromCareer(heroSegment));

  const heroesRanked = heroes.filter((h) => h.matches > 0);
  const heroesUnranked: HeroesRanked[] = [];

  const playerDTO: PlayerDTO = {
    uid: playerUid,
    name: playerName,
    isPrivate:
      metadata.isPrivateCareerOverview || metadata.isPrivateCareerStatistics,
    player: {
      uid: playerUid,
      level: playerLevel,
      name: playerName,
      icon: {
        player_icon_id: playerIconId,
        player_icon: avatarUrl,
        banner: undefined
      },
      rank: {
        rank: rankTier,
        image: rankIcon,
        color: rankColor
      },
      team: {
        club_team_id: '',
        club_team_mini_name: metadata.clubMiniName || '',
        club_team_type: ''
      },
      info: {
        completed_achievements: '',
        login_os: metadata.isPC
? 'pc'
: 'console',
        rank_game_season: {
          1: {
            rank_game_id: 1,
            level: extractRankLevel(rankTier),
            rank_score: rankScore,
            max_level: lifetimePeakStat
              ? extractRankLevel(
                  lifetimePeakStat.metadata?.tierName || rankTier
                )
              : extractRankLevel(rankTier),
            max_rank_score: Number(lifetimePeakStat?.value) || rankScore,
            update_time: new Date(metadata.lastUpdated.value).getTime(),
            win_count: totalWins,
            protect_score: 0,
            diff_score: 0
          }
        }
      }
    },
    overall_stats: {
      total_matches: Math.round(totalMatches),
      total_wins: Math.round(totalWins),
      unranked: {
        total_matches: 0,
        total_wins: 0,
        total_assists: 0,
        total_deaths: 0,
        total_kills: 0,
        total_time_played: '0h 0m',
        total_time_played_raw: 0,
        total_mvp: 0,
        total_svp: 0
      },
      ranked: {
        total_matches: Math.round(totalMatches),
        total_wins: Math.round(totalWins),
        total_assists: Math.round(totalAssists),
        total_deaths: Math.round(totalDeaths),
        total_kills: Math.round(totalKills),
        total_time_played: totalTimePlayedDispley, // nota: revisar "displayType" para saber q formato viene
        total_time_played_raw: totalTimePlayedValue, //
        total_mvp: Math.round(totalMvp),
        total_svp: Math.round(totalSvp)
      }
    },
    heroes_ranked: heroesRanked,
    heroes_unranked: heroesUnranked,
    updates: {
      info_update_time: new Date(metadata.lastUpdated.value).toISOString(),
      last_history_update: null,
      last_inserted_match: null,
      last_update_request: null
    },
    match_history: [],
    rank_history: [],
    hero_matchups: [],
    team_mates: [],
    maps: []
  };

  return playerDTO;
}

/**
 * Transforms a single hero segment from tracker.gg into the HeroesRanked type
 */
function transformHeroDataFromCareer(hero: Datum): HeroesRanked {
  const heroId = hero.attributes.heroId ?? 0;
  const heroName = hero.metadata.name ?? 'Unknown';
  const heroThumbnail = hero.metadata.imageUrl ?? '';

  const stats = hero.stats;

  return {
    hero_id: heroId,
    hero_name: heroName,
    hero_thumbnail: heroThumbnail,
    matches: Math.round(Number(stats.matchesPlayed?.value) || 0),
    wins: Math.round(Number(stats.matchesWon?.value) || 0),
    mvp: Math.round(Number(stats.totalMvp?.value) || 0),
    svp: Math.round(Number(stats.totalSvp?.value) || 0),
    kills: Math.round(Number(stats.kills?.value) || 0),
    deaths: Math.round(Number(stats.deaths?.value) || 0),
    assists: Math.round(Number(stats.assists?.value) || 0),
    play_time: Math.round(Number(stats.timePlayed?.value) || 0),
    damage: Math.round(Number(stats.totalHeroDamage?.value) || 0),
    heal: Math.round(Number(stats.totalHeroHeal?.value) || 0),
    damage_taken: Math.round(Number(stats.totalDamageTaken?.value) || 0),
    main_attack: {
      total: Math.round(Number(stats.mainAttacks?.value) || 0),
      hits: Math.round(Number(stats.mainAttackHits?.value) || 0)
    }
  };
}

/**
 * Extracts rank level from tier name
 * Example: "Grandmaster III" -> 6
 */
function extractRankLevel(tierName: string): number {
  const rankMap: Record<string, number> = {
    bronze: 0,
    silver: 1,
    gold: 2,
    platinum: 3,
    diamond: 4,
    grandmaster: 6,
    eternity: 7,
    celestial: 8,
    'one above all': 9
  };

  const tierLower = tierName.toLowerCase();
  for (const [rank, level] of Object.entries(rankMap)) {
    if (tierLower.includes(rank)) {
      return level;
    }
  }

  return 0;
}

/**
 * Transforms Tracker.gg heroes metadata to HeroesDTO format.
 * API URL: https://api.tracker.gg/api/v1/marvel-rivals/metadata/type/hero
 */
export function transformTrackerHeroesToHeroesDTO(
  trackerData: TrackerHeroesMetadata
): HeroesDTO[] {
  return trackerData.data.items.map((hero) => {
    const role = mapRoleToHeroesDTO(hero.roleName);

    return {
      id: hero.key,
      name: hero.name,
      real_name: '',
      imageUrl: hero.imageUrl,
      role,
      attack_type: AttackType.Projectile, // no viene en el tracker salu2
      team: [],
      difficulty: '',
      bio: hero.description,
      lore: '',
      transformations: [],
      costumes: [],
      abilities: []
    };
  });
}

/**
 * Maps Tracker.gg role name to HeroesDTO Role enum
 */
function mapRoleToHeroesDTO(roleName: string): Role {
  switch (roleName) {
    case 'Duelist':
      return Role.Duelist;
    case 'Strategist':
      return Role.Strategist;
    case 'Vanguard':
      return Role.Vanguard;
    default:
      return Role.Duelist; // Default fallback
  }
}
