import { MergeOptions, LogLevels, Logger } from 'seyfert/lib/common';
import { type IValidation, createValidate } from 'typia';
import { Bucket } from 'seyfert/lib/api/bucket';

import type { LeaderboardPlayerHeroDTO } from '../../types/dtos/LeaderboardPlayerHeroDTO';
import type { FormattedPatch, PatchNotesDTO } from '../../types/dtos/PatchNotesDTO';
import type { FindedPlayerDTO } from '../../types/dtos/FindedPlayerDTO';
import type { MatchHistoryDTO } from '../../types/dtos/MatchHistoryDTO';
import type { HeroesDTO } from '../../types/dtos/HeroesDTO';
import type { PlayerDTO } from '../../types/dtos/PlayerDTO';
import type { UpdateDTO } from '../../types/dtos/UpdateDTO';
import type { HeroDTO } from '../../types/dtos/HeroDTO';
import type { CareerDTO } from '../../types/v2/Career';

import { MARVELRIVALS_DOMAIN, TRACKER_DOMAIN } from '../../utils/env';
import { isProduction } from '../constants';

const isHeroes = createValidate<HeroesDTO[]>();
const isHero = createValidate<HeroDTO>();
const isFindedPlayer = createValidate<FindedPlayerDTO>();
const isMatchHistory = createValidate<MatchHistoryDTO>();
const isLeaderboardPlayerHero = createValidate<LeaderboardPlayerHeroDTO>();
const isPatchNotes = createValidate<PatchNotesDTO>();
const isFormattedPatch = createValidate<FormattedPatch>();
const isPlayer = createValidate<PlayerDTO>();
const isCareer = createValidate<CareerDTO>();
const isUpdatedPlayer = createValidate<UpdateDTO>();


export class Api {
  ratelimits = new Map<string, Bucket>();

  logger = new Logger({
    name: '[Rivals API]',
    logLevel: isProduction
      ? LogLevels.Info
      : LogLevels.Debug
  });

  // Then modify the fetchJson method to use caching
  private readonly baseTrackerUrl = TRACKER_DOMAIN;

  private readonly trackerApiUrl: string = `${this.baseTrackerUrl}/api/v2/marvel-rivals/standard`;

  private readonly baseMarvelRivalsUrl: string = MARVELRIVALS_DOMAIN;

  private readonly marvelRivalsApiUrlV2: string = `${this.baseMarvelRivalsUrl}/api/v2`;

  private readonly marvelRivalsApiUrlV1: string = `${this.baseMarvelRivalsUrl}/api/v1`;

  private readonly cdnUrl: string = `${this.baseMarvelRivalsUrl}/rivals`;

  private apiKeyIndex = 0;

  constructor(private readonly apiKeys: string[], private readonly redisClient: ReturnType<typeof import('@redis/client')['createClient']>) { }

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
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: `patch-note/${id}`,
      validator: isFormattedPatch,
      cacheKey: `patch-notes/${id}`,
      expireTime: 60 * 60,
      route: 'patch-notes/:id'
    });
  }

  public getPatchNotes() {
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: 'patch-notes',
      validator: isPatchNotes,
      cacheKey: 'patch-notes',
      expireTime: 60 * 60,
      route: 'patch-notes'
    });
  }

  // Career
  public async getCareer(id: string, { mode, season }: {
    mode: 'all';
    season: 1 | 2 | 3;
  }) {
    return this.fetchWithRetry({
      domain: this.trackerApiUrl,
      endpoint: `profile/ign/${id}/segments/career`,
      validator: isCareer,
      query: {
        mode,
        season: season.toString()
      },
      cacheKey: `career/${id}/${mode}/${season}`,
      expireTime: 5 * 60,
      route: 'profiles/ign/:id/segments/career'
    });
  }

  // Matches
  public getMatchHistory(userNameOrId: string, options: {
    season?: 1.5 | 0 | 1 | 2;
    page?: number;
    limit?: number;
    skip?: number;
    game_mode?: 0 | 1 | 2 | 3 | 9 | 7;
    timestamp?: number;
  } = {}) {
    options = MergeOptions({
      season: 2,
      page: 1,
      limit: 40,
      skip: 0,
      game_mode: 0,
      timestamp: undefined
    }, options);

    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV2,
      endpoint: `player/${encodeURIComponent(userNameOrId)}/match-history`,
      validator: isMatchHistory,
      cacheKey: `match-history/${userNameOrId}/${Object.entries(options).filter((kv) => kv.at(1) !== undefined).map((kv) => `${kv[0]}${kv[1]}`).join('_')}`,
      expireTime: 5 * 60,
      route: 'match-history/:id',
      query: options
    });
  }

  // Players
  updatePlayer(id: number) {
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: `player/${id}/update`,
      validator: isUpdatedPlayer,
      route: 'player/:id/update'
    });
  }

  public searchPlayer(username: string) {
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: `find-player/${encodeURIComponent(username)}`,
      validator: isFindedPlayer,
      cacheKey: `find-player/${username}`,
      expireTime: 30 * 60,
      route: 'find-player/:id'
    });
  }

  public async getPlayer(nameOrId: string, options: Parameters<typeof this.fetchPlayer>[1]) {
    if (/^\d+$/.exec(nameOrId)) {
      return this.fetchPlayer(nameOrId, options);
    }

    const playerFound = await this.searchPlayer(nameOrId);
    if (!playerFound) {
      return playerFound;
    }
    return this.fetchPlayer(playerFound.uid, options);
  }

  fetchPlayer(id: string, options: {
    season?: 1.5 | 0 | 1 | 2;
  } = {}) {
    options = MergeOptions({
      season: 2
    }, options);
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: `player/${id}`,
      validator: isPlayer,
      cacheKey: `player/${id}/${Object.entries(options).filter((kv) => kv.at(1) !== undefined).map((kv) => `${kv[0]}${kv[1]}`).join('_')}`,
      expireTime: 5 * 60,
      route: 'player/:id',
      query: options
    });
  }

  // async fetchPlayer(id: string): Promise<PlayerDTO | undefined | APIError> {
  //   if (await this.redisClient.EXISTS(`player/${id}`)) {
  //     const user = await this.redisClient.GET(`player/${id}`);
  //     if (!user || user === 'null') {
  //       return undefined;
  //     }
  //     return JSON.parse(user) as PlayerDTO | APIError;
  //   }

  //   const url = `${this.trackerApiUrl}/profile/ign/${encodeURIComponent(id)}`;
  //   const response = await this.fetchJson<PlayerDTO>(url);

  //   await this.redisClient.SET(`player/${id}`, JSON.stringify(response), {
  //     EX: 15 * 60
  //   });

  //   if (!response) {
  //     return undefined;
  //   }

  //   // validamos que response no sea un APIError
  //   if ('errors' in response) {
  //     return response;
  //   }

  //   // Validate response with typia
  //   const validation = isPlayer(response);
  //   if (!validation.success) {
  //     console.error('Invalid API response:', validation.errors);
  //     return undefined;
  //   }

  //   return response;
  // }

  // Heroes
  public getLeaderboardHero(nameOrId: string, platform: 'xbox' | 'pc' | 'ps' = 'pc') {
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: `heroes/leaderboard/${nameOrId}`,
      validator: isLeaderboardPlayerHero,
      cacheKey: `leaderboard-hero/${nameOrId}/${platform}`,
      query: {
        platform
      },
      expireTime: 15 * 60,
      route: 'heroes/leaderboard/:id'
    });
  }

  public async getHeroes() {
    const heroes = await this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: 'heroes',
      validator: isHeroes,
      cacheKey: 'heroes',
      expireTime: 24 * 60 * 60,
      route: 'heroes'
    });
    return heroes ?? [];
  }

  public getHero(nameOrId: string) {
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: `heroes/hero/${nameOrId}`,
      validator: isHero,
      cacheKey: `hero/${nameOrId}`,
      expireTime: 24 * 60 * 60,
      route: 'heroes/hero/:id'
    });
  }

  // internal
  private async fetchWithRetry<T>({
    domain,
    cacheKey,
    endpoint,
    validator,
    query,
    expireTime,
    route
  }: {
    endpoint: string;
    domain: Api['marvelRivalsApiUrlV1' | 'marvelRivalsApiUrlV2' | 'trackerApiUrl'];
    route: string;
    validator: (data: unknown) => IValidation<T>;
    cacheKey?: string;
    query?: Record<string, undefined | string | number>;
    retries?: number;
    expireTime?: number;
  }): Promise<null | T> {
    if (cacheKey) {
      const cachedData = await this.redisClient.GET(cacheKey);
      if (cachedData) {
        if (cachedData === 'null') {
          return null;
        }
        return JSON.parse(cachedData) as T;
      }
    }

    this.logger.debug(endpoint);

    const response = await this.fetchApi({
      domain,
      endpoint,
      query: query
        ? new URLSearchParams(
          Object.fromEntries(
            Object.entries(query).filter((kv): kv is [string, string | number] => kv.at(1) !== undefined).map(([key, value]) => [key, value.toString()] as const)
          )
        )
        : undefined,
      route
    });

    // Si la respuesta es 404 (Not Found), retorna null
    if (response.status === 404) {
      if (cacheKey) {
        await this.redisClient.SET(cacheKey, 'null', {
          EX: expireTime
        });
      }
      return null;
    }

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(text);
      let err: undefined | string;
      try {
        err = (JSON.parse(text) as { message?: string }).message;
        if (!err) {
          throw new Error('unknown error');
        }
      } catch {
        err = text;
      }

      throw new Error(err);
    }

    const data = await response.json();
    const check = validator(data);

    if (!check.success) {
      this.logger.fatal(check.errors, `${domain}/${endpoint}`);
      throw new Error(check.errors.map((err) => `Expected: ${err.expected} on ${err.path}`).join('\n'));
    }
    if (cacheKey) {
      await this.redisClient.SET(cacheKey, JSON.stringify(check.data), {
        EX: expireTime
      });
    }
    return check.data;
  }

  // private async fetchJson<T>(url: string): Promise<APIError | null | T> {
  //   try {
  //     const response = await fetch(url, {
  //       headers: {
  //         'User-Agent': 'Chrome/121',
  //         Accept: 'application/json',
  //         'Accept-Language': 'es-AR,en;q=0.9',
  //         'Accept-Encoding': 'gzip, deflate, br',
  //         Connection: 'keep-alive',
  //         'Cache-Control': 'no-cache',
  //         Pragma: 'no-cache',
  //         DNT: '1',
  //         'Upgrade-Insecure-Requests': '1'
  //       },
  //       credentials: 'omit',
  //       referrerPolicy: 'strict-origin-when-cross-origin',
  //       mode: 'cors'
  //     });

  //     if (response.status === 400) {
  //       return await response.json() as APIError;
  //     }

  //     if (!response.ok) {
  //       throw new Error(await response.text());
  //     }

  //     const jsonData = await response.json();

  //     return jsonData as T;
  //   } catch (error) {
  //     throw new Error(`Failed to fetch JSON: ${String(error)}`);
  //   }
  // }

  private async fetchApi({ domain, endpoint, query, route }: {
    domain: Api['marvelRivalsApiUrlV1' | 'marvelRivalsApiUrlV2' | 'trackerApiUrl'];
    endpoint: string;
    query?: URLSearchParams;
    route: string;
  }) {
    const callback = async (next: () => void, resolve: (data: Response) => void, reject: (err: unknown) => void) => {
      const url = `${domain}/${endpoint}?${query ?? ''}`;
      const bucket = this.ratelimits.get(route)!;
      const headers = {
        'x-api-key': this.rotateApiKey(),
        'Content-Type': 'application/json',
        'User-Agent': 'Chrome/121',
        Accept: 'application/json',
        'Accept-Language': 'es-AR,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        DNT: '1',
        'Upgrade-Insecure-Requests': '1'
      };

      const response = await fetch(url, {
        headers,
        credentials: 'omit',
        referrerPolicy: 'strict-origin-when-cross-origin',
        mode: 'cors'
      });

      const xRatelimitLimit = response.headers.get('x-ratelimit-limit');
      const xRatelimitRemaining = response.headers.get('x-ratelimit-remaining');
      const xRatelimitReset = response.headers.get('x-ratelimit-reset');

      if (xRatelimitLimit !== null && xRatelimitRemaining !== null && xRatelimitReset !== null) {
        if (
          xRatelimitLimit === 'cache' || xRatelimitRemaining === 'cache' || xRatelimitReset === 'cache'
        ) {
          //
        } else {
          bucket.remaining = Number(xRatelimitRemaining);
          bucket.limit = Number(xRatelimitLimit);
          bucket.resetAfter = Number(xRatelimitReset) * 1e3 - new Date().getTime();
        }
      }

      if (!response.ok || response.status !== 200) {
        const text = await response.text();
        this.logger.fatal(text, url);
        let errorMessage: string;
        try {
          const json = JSON.parse(text);
          errorMessage = (json as {
            message?: string;
          }).message ?? (json as {
            errors?: {
              code: string;
              message: string;
            }[];
          }).errors?.[0].message ?? 'Unknown error';
        } catch {
          errorMessage = `API request failed with status ${response.status}: ${response.statusText}`;
        }
        next();
        reject(errorMessage); return;
      }

      next();
      resolve(response);
    };

    const { promise, resolve, reject } = Promise.withResolvers<Response>();

    if (!this.ratelimits.has(route)) {
      this.ratelimits.set(route, new Bucket(1));
    }
    this.ratelimits.get(route)!.push({
      next: callback,
      resolve,
      reject
    });

    return promise;
  }
}
