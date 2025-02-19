import { LogLevels, Logger, delay } from 'seyfert/lib/common';
import { type IValidation, createValidate } from 'typia';
import { LimitedCollection } from 'seyfert';

import type { LeaderboardPlayerHeroDTO } from '../../types/dtos/LeaderboardPlayerHeroDTO';
import type { FormattedPatch, PatchNotesDTO } from '../../types/dtos/PatchNotesDTO';
import type { FindedPlayerDTO } from '../../types/dtos/FindedPlayerDTO';
import type { MatchHistoryDTO } from '../../types/dtos/MatchHistoryDTO';
import type { HeroesDTO } from '../../types/dtos/HeroesDTO';
import type { PlayerDTO } from '../../types/dtos/PlayerDTO';
import type { HeroDTO } from '../../types/dtos/HeroDTO';

import { isProduction } from '../constants';

export const isHeroes = createValidate<HeroesDTO[]>();
export const isHero = createValidate<HeroDTO>();
export const isPlayer = createValidate<PlayerDTO>();
export const isFindedPlayer = createValidate<FindedPlayerDTO>();
export const isMatchHistory = createValidate<MatchHistoryDTO>();
export const isLeaderboardPlayerHero = createValidate<LeaderboardPlayerHeroDTO>();
export const isPatchNotes = createValidate<PatchNotesDTO>();
export const isFormattedPatch = createValidate<FormattedPatch>();

export class Api {
  logger = new Logger({
    name: '[Rivals]',
    logLevel: isProduction
      ? LogLevels.Info
      : LogLevels.Debug
  });

  cache = {
    searchPlayer: new LimitedCollection<string, FindedPlayerDTO | null>({
      expire: 15 * 60e3
    }),
    fetchPlayer: new LimitedCollection<string, PlayerDTO | null>({
      expire: 15 * 60e3
    }),
    leaderboardPlayerHero: new LimitedCollection<string, LeaderboardPlayerHeroDTO | null>({
      expire: 15 * 60e3
    }),
    patchNotes: new LimitedCollection<string, PatchNotesDTO | null>({
      expire: 60 * 60e3
    }),
    heroes: [] as HeroesDTO[]
  };

  private readonly retryDelay: number = 1_000; // Retardo entre reintentos en milisegundos

  private readonly maxRetries: number = 3; // Número máximo de reintentos

  private readonly baseUrl: string = 'https://marvelrivalsapi.com';

  private readonly cdnUrl: string = `${this.baseUrl}/rivals`;

  private readonly apiUrl: string = `${this.baseUrl}/api/v1`;

  private apiKeyIndex = 0;

  constructor(private readonly apiKeys: string[]) { }

  public buildImage(path: string) {
    return `${this.cdnUrl}${path}`;
  }

  private rotateApiKey() {
    const i = this.apiKeyIndex++;
    if (this.apiKeyIndex >= this.apiKeys.length) {
      this.apiKeyIndex = 0;
    }
    return this.apiKeys[i];
  }

  // Patch Notes
  public getPatchNotesById(id: string) {
    return this.fetchWithRetry(`patch-note/${id}`, isFormattedPatch);
  }

  public getPatchNotes() {
    return this.fetchWithCacheRetry(
      'patch-notes', isPatchNotes, this.cache.patchNotes
    );
  }

  // Players
  public searchPlayer(username: string) {
    return this.fetchWithCacheRetry(`find-player/${username}`, isFindedPlayer, this.cache.searchPlayer);
  }

  public async getPlayer(nameOrId: string) {
    if (/^\d+$/.exec(nameOrId)) {
      return this.fetchPlayer(nameOrId);
    }

    const playerFound = await this.searchPlayer(nameOrId);
    if (!playerFound) {
      return playerFound;
    }
    return this.fetchPlayer(playerFound.uid);
  }

  public getMatchHistory(usernameOrId: string) {
    return this.fetchWithRetry(`player/${usernameOrId}/match-history`, isMatchHistory);
  }

  public fetchPlayer(uid: string) {
    return this.fetchWithCacheRetry(`player/${uid}`, isPlayer, this.cache.fetchPlayer);
  }

  // Heroes
  public getLeaderboardHero(nameOrId: string) {
    return this.fetchWithCacheRetry(`heroes/leaderboard/${nameOrId}`, isLeaderboardPlayerHero, this.cache.leaderboardPlayerHero);
  }

  public async getHeroes() {
    if (this.cache.heroes.length) {
      return this.cache.heroes;
    }
    const heroes = await this.fetchWithRetry('heroes', isHeroes);
    if (heroes) {
      this.cache.heroes = heroes;
    }
    return [];
  }

  public getHero(nameOrId: string) {
    return this.fetchWithRetry(`heroes/${nameOrId}`, isHero);
  }

  // api

  private async fetchWithRetry<T>(
    endpoint: string,
    validator: (data: unknown) => IValidation<T>, // Validador de types
    retries: number = this.maxRetries
  ): Promise<null | T> {
    let data: unknown;
    try {
      this.logger.debug(endpoint);

      const response = await this.fetchApi(endpoint);

      // Si la respuesta es 404 (Not Found), retorna null
      if (response.status === 404) {
        return null;
      }

      data = await response.json();
    } catch (error) {
      if (retries > 0) {
        await delay(this.retryDelay);
        return this.fetchWithRetry(endpoint, validator, retries - 1);
      }
      throw error;
    }

    const check = validator(data);

    if (!check.success) {
      throw new Error(check.errors.map((err) => `Expected: ${err.expected} on ${err.path}`).join('\n'));
    }

    return check.data;
  }

  private async fetchWithCacheRetry<T>(
    endpoint: string,
    validator: (data: unknown) => IValidation<T>, // Validador de types
    cache: LimitedCollection<string, null | T>,
    retries: number = this.maxRetries
  ): Promise<null | T> {
    if (cache.has(endpoint)) {
      return cache.get(endpoint)!;
    }
    const result = await this.fetchWithRetry(endpoint, validator, retries);

    cache.set(endpoint, result);

    return result;
  }

  private async fetchApi(endpoint: string) {
    const url = `${this.apiUrl}/${endpoint}`;

    const headers = {
      'x-api-key': this.rotateApiKey(),
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, { headers });

    if (!response.ok && response.status !== 404) {
      const errorMessage = `API request failed with status ${response.status}: ${response.statusText}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    return response;
  }
}
