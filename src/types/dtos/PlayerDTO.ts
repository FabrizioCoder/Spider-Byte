export interface PlayerDTO {
  readonly uid: number;
  readonly name: string;
  readonly updates: Updates;
  readonly player: Player;
  readonly isPrivate: boolean;
  readonly overall_stats: OverallStats;
  readonly match_history: MatchHistory[];
  readonly rank_history: RankHistory[];
  readonly hero_matchups: HeroMatchup[];
  readonly team_mates: TeamMate[];
  readonly heroes_ranked: HeroesRanked[];
  readonly heroes_unranked: HeroesRanked[];
  readonly maps: Map[];
}

export interface HeroMatchup {
  readonly hero_id: number | null;
  readonly hero_name: string;
  readonly hero_class: HeroClass;
  readonly hero_thumbnail: string | null;
  readonly matches: number;
  readonly wins: number;
  readonly win_rate: string;
}

export enum HeroClass {
  Duelist = 'Duelist',
  Strategist = 'Strategist',
  Vanguard = 'Vanguard',
  Unknown = 'Unknown'
}

export interface HeroesRanked {
  readonly hero_id: number;
  readonly hero_name: string;
  readonly hero_thumbnail: string;
  readonly matches: number;
  readonly wins: number;
  readonly mvp: number;
  readonly svp: number;
  readonly kills: number;
  readonly deaths: number;
  readonly assists: number;
  readonly play_time: number;
  readonly damage: number;
  readonly heal: number;
  readonly damage_taken: number;
  readonly main_attack: MainAttack;
}

export interface MainAttack {
  readonly total: number;
  readonly hits: number;
}

export interface Map {
  readonly map_id: number;
  readonly map_thumbnail?: string;
  readonly matches: number;
  readonly wins: number;
  readonly kills: number;
  readonly deaths: number;
  readonly assists: number;
  readonly play_time: number;
}

export interface MatchHistory {
  readonly match_uid: string;
  readonly map_id: number;
  readonly duration: number;
  readonly season: number;
  readonly winner_side: number;
  readonly mvp_uid: number;
  readonly svp_uid: number;
  readonly match_time_stamp: number;
  readonly play_mode_id: number;
  readonly game_mode_id: number;
  readonly score_info: Record<string, number> | null;
  readonly player_performance: PlayerPerformance;
  readonly map_thumbnail?: string;
}

export interface PlayerPerformance {
  readonly player_uid: number;
  readonly hero_id: number | null;
  readonly hero_name: string | null;
  readonly hero_type: string | null;
  readonly kills: number;
  readonly deaths: number;
  readonly assists: number;
  readonly is_win: IsWin;
  readonly disconnected: boolean;
  readonly camp: number;
  readonly score_change: number | null;
  readonly level: number | null;
  readonly new_level: number | null;
  readonly new_score: number | null;
}

export interface IsWin {
  readonly score: number;
  readonly is_win: boolean;
}

export interface OverallStats {
  readonly total_matches: number;
  readonly total_wins: number;
  readonly unranked: Ranked;
  readonly ranked: Ranked;
}

export interface Ranked {
  readonly total_matches: number;
  readonly total_wins: number;
  readonly total_assists: number;
  readonly total_deaths: number;
  readonly total_kills: number;
  readonly total_time_played?: string;
  readonly total_time_played_raw: number;
  readonly total_mvp: number;
  readonly total_svp: number;
}

export interface Player {
  readonly uid: number;
  readonly level: string;
  readonly name: string;
  readonly icon: Icon;
  readonly rank: Rank;
  readonly team: Team;
  readonly info: Info;
}

export interface Icon {
  readonly player_icon_id: string;
  readonly player_icon: string;
  readonly banner?: string;
}

export interface Info {
  readonly completed_achievements: string;
  readonly login_os: string;
  readonly rank_game_season: Record<string, RankGameSeason>;
}

export interface RankGameSeason {
  readonly rank_game_id: number;
  readonly level: number;
  readonly rank_score: number;
  readonly max_level: number;
  readonly max_rank_score: number;
  readonly update_time: number;
  readonly win_count: number;
  readonly protect_score: number;
  readonly diff_score: number;
}

export interface Rank {
  readonly rank: string;
  readonly image: string | null;
  readonly color: string | null;
}

export interface Team {
  readonly club_team_id: string;
  readonly club_team_mini_name: string;
  readonly club_team_type: string;
}

export interface RankHistory {
  readonly match_time_stamp: number;
  readonly level_progression: LevelProgression;
  readonly score_progression: ScoreProgression;
}

export interface LevelProgression {
  readonly from: number;
  readonly to: number;
}

export interface ScoreProgression {
  readonly add_score: number;
  readonly total_score: number;
}

export interface TeamMate {
  readonly player_info: PlayerInfo;
  readonly matches: number;
  readonly wins: number;
  readonly win_rate: string;
}

export interface PlayerInfo {
  readonly nick_name: string;
  readonly player_icon: string;
  readonly player_uid: number;
}

export interface Updates {
  readonly info_update_time: string;
  readonly last_history_update: string | null;
  readonly last_inserted_match: string | null;
  readonly last_update_request: string | null;
}
