export interface Profile {
  data: Data;
}

export interface Data {
  platformInfo: PlatformInfo;
  userInfo: UserInfo;
  metadata: DataMetadata;
  segments: Segment[];
  availableSegments: any[];
  expiryDate: string;
}

export interface DataMetadata {
  lastUpdated: LastUpdated;
  isPC: boolean;
  clubMiniName: string | null;
  isPrivateCareerOverview: boolean;
  isPrivateCareerStatistics: boolean;
  isPrivateBattleHistory: boolean;
  level: number;
  gamemodes: Gamemode[];
  currentSeason: number;
  defaultSeason: number;
  seasons: Season[];
}

export interface Gamemode {
  id: string;
  name: string;
}

export interface LastUpdated {
  value: string;
  displayValue: string;
}

export interface Season {
  id: number;
  name: string;
  shortName: string;
}

export interface PlatformInfo {
  platformSlug: string;
  platformUserId: null;
  platformUserHandle: string;
  platformUserIdentifier: string;
  avatarUrl: string;
  additionalParameters: null;
}

export interface Segment {
  type: Type;
  attributes: Attributes;
  metadata: SegmentMetadata;
  expiryDate: string;
  stats: Stats;
}

export interface Attributes {
  season?: number;
  mode?: Mode;
  heroId?: number;
  role?: Role;
  roleId?: Role;
}

export enum Mode {
  All = 'all'
}

export enum Role {
  Duelist = 'duelist',
  Strategist = 'strategist',
  Vanguard = 'vanguard'
}

export interface SegmentMetadata {
  name?: string;
  imageUrl?: string;
  roleName?: RoleName;
  color?: string;
}

export enum RoleName {
  Duelist = 'Duelist',
  Strategist = 'Strategist',
  Vanguard = 'Vanguard'
}

export interface Stats {
  timePlayed?: Assists;
  matchesPlayed?: Assists;
  matchesWon?: Assists;
  matchesWinPct?: Assists;
  kills?: Assists;
  deaths?: Assists;
  assists?: Assists;
  kdRatio?: Assists;
  kdaRatio?: Assists;
  totalHeroDamage?: Assists;
  totalHeroDamagePerMinute?: Assists;
  totalHeroHeal?: Assists;
  totalHeroHealPerMinute?: Assists;
  totalDamageTaken?: Assists;
  totalDamageTakenPerMinute?: Assists;
  lastKills?: Assists;
  headKills?: Assists;
  soloKills?: Assists;
  maxSurvivalKills?: Assists;
  maxContinueKills?: Assists;
  continueKills3?: Assists;
  continueKills4?: Assists;
  continueKills5?: Assists;
  continueKills6?: Assists;
  mainAttacks?: Assists;
  mainAttackHits?: Assists;
  shieldHits?: Assists;
  summonerHits?: Assists;
  chaosHits?: Assists;
  totalMvp?: Assists;
  totalMvpPct?: Assists;
  totalSvp?: Assists;
  totalSvpPct?: Assists;
  ranked?: Ranked;
  peakRanked?: Ranked;
  peakTiers?: PeakTiers;
  lifetimePeakRanked?: LifetimePeakRanked;
  timePlayedWon?: Assists;
  survivalKills?: Assists;
  continueKills?: Assists;
  featureNormalData1?: Assists;
  featureNormalData2?: Assists;
  featureNormalData3?: Assists;
  featureCriticalRate1CritHits?: Assists;
  featureCriticalRate1Hits?: Assists;
  featureCriticalRate2CritHits?: Assists;
  featureCriticalRate2Hits?: Assists;
  featureHitRate1UseCount?: Assists;
  featureHitRate1RealHitHeroCount?: Assists;
  featureHitRate1ChaosHits?: Assists;
  featureHitRate1AllyHits?: Assists;
  featureHitRate1HeroHits?: Assists;
  featureHitRate1EnemyHits?: Assists;
  featureHitRate1ShieldHits?: Assists;
  featureHitRate1SummonerHits?: Assists;
  featureHitRate2UseCount?: Assists;
  featureHitRate2RealHitHeroCount?: Assists;
  featureHitRate2ChaosHits?: Assists;
  featureHitRate2AllyHits?: Assists;
  featureHitRate2HeroHits?: Assists;
  featureHitRate2EnemyHits?: Assists;
  featureHitRate2ShieldHits?: Assists;
  featureHitRate2SummonerHits?: Assists;
  featureSpecialData1Total?: Assists;
  featureSpecialData1Value?: Assists;
}

export interface Assists {
  displayName: string;
  displayCategory: DisplayCategory;
  category: Category;
  metadata: AssistsMetadata;
  value: number | null;
  displayValue: string | null;
  displayType: AssistsDisplayType;
  percentile?: number;
}

export enum Category {
  Combat = 'combat',
  Damage = 'damage',
  Feature = 'feature',
  Game = 'game',
  Healing = 'healing'
}

export enum DisplayCategory {
  Combat = 'Combat',
  Damage = 'Damage',
  Feature = 'Feature',
  Game = 'Game',
  Healing = 'Healing'
}

export enum AssistsDisplayType {
  Number = 'Number',
  NumberPercentage = 'NumberPercentage',
  NumberPrecision1 = 'NumberPrecision1',
  NumberPrecision2 = 'NumberPrecision2',
  TimeSeconds = 'TimeSeconds'
}

export interface AssistsMetadata { }

export interface LifetimePeakRanked {
  displayName: DisplayName;
  category?: string;
  metadata: LifetimePeakRankedMetadata;
  value: number;
  displayValue: string | null;
  displayType: LifetimePeakRankedDisplayType;
}

export enum DisplayName {
  LifetimePeakRankScore = 'Lifetime Peak Rank Score',
  PeakRating = 'Peak Rating'
}

export enum LifetimePeakRankedDisplayType {
  Custom = 'Custom',
  String = 'String'
}

export interface LifetimePeakRankedMetadata {
  unit: Unit;
  iconUrl: string;
  tierName: string;
  tierShortName: string;
  color: string;
  season: number;
  seasonName: string;
  seasonShortName: string;
}

export enum Unit {
  Rs = 'RS'
}

export interface Ranked {
  displayName: string;
  category: string;
  metadata: PeakRankedMetadata;
  value: number;
  displayValue: string;
  displayType: LifetimePeakRankedDisplayType;
}

export interface PeakRankedMetadata {
  unit: Unit;
  iconUrl: string;
  tierName: string;
  tierShortName: string;
  color: string;
}

export interface PeakTiers {
  displayName: string;
  metadata: AssistsMetadata;
  value: LifetimePeakRanked[];
  displayValue: null;
  displayType: LifetimePeakRankedDisplayType;
}

export enum Type {
  Hero = 'hero',
  HeroRole = 'hero-role',
  Overview = 'overview',
  RankedPeaks = 'ranked-peaks'
}

export interface UserInfo {
  userId: null;
  isPremium: boolean;
  isVerified: boolean;
  isInfluencer: boolean;
  isPartner: boolean;
  countryCode: null;
  customAvatarUrl: null;
  customHeroUrl: null;
  customAvatarFrame: null;
  customAvatarFrameInfo: null;
  premiumDuration: null;
  socialAccounts: any[];
  badges: null;
  pageviews: number;
  xpTier: null;
  isSuspicious: null;
}
