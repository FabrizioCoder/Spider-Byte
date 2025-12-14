import { MergeOptions, LogLevels, Logger } from 'seyfert/lib/common';
import { type IValidation, createValidate } from 'typia';
import { Bucket } from 'seyfert/lib/api/bucket';

import type { LeaderboardPlayerHeroDTO } from '../../types/dtos/LeaderboardPlayerHeroDTO';
import type { MatchHistoryDTO, MatchHistory } from '../../types/dtos/MatchHistoryDTO';
import type { FormattedPatch, PatchNotesDTO } from '../../types/dtos/PatchNotesDTO';
import type { AutocompleteDTO } from '../../types/dtos/AutocompleteDTO';
import type { FoundPlayerDTO } from '../../types/dtos/FoundPlayerDTO';
import type { GameModes } from '../../utils/images/match-history';
import type { HeroesDTO } from '../../types/dtos/HeroesDTO';
import type { PlayerDTO } from '../../types/dtos/PlayerDTO';
import type { UpdateDTO } from '../../types/dtos/UpdateDTO';
import type { HeroDTO } from '../../types/dtos/HeroDTO';
import type { MapsDTO } from '../../types/dtos/MapsDTO';
import type { MapDTO } from '../../types/dtos/MapsDTO';

import { MARVELRIVALS_DOMAIN, TRACKER_DOMAIN } from '../../utils/env';
import { Seasons } from '../../utils/constants';
import { isProduction } from '../constants';

const validateHeroes = createValidate<HeroesDTO[]>();
const validateHero = createValidate<HeroDTO>();
const validateFoundPlayer = createValidate<FoundPlayerDTO>();
const validateMatchHistory = createValidate<MatchHistoryDTO>();
const validateLeaderboardPlayerHero = createValidate<LeaderboardPlayerHeroDTO>();
const validatePatchNotes = createValidate<PatchNotesDTO>();
const validateFormattedPatch = createValidate<FormattedPatch>();
const validatePlayer = createValidate<PlayerDTO>();
const validateUpdatedPlayer = createValidate<UpdateDTO>();
const validateMaps = createValidate<MapsDTO>();
const validateAutocompletePlayerNames = createValidate<AutocompleteDTO>();

export class Api {
  ratelimits = new Map<string, Bucket>();

  logger = new Logger({
    name: '[Rivals API]',
    logLevel: isProduction
      ? LogLevels.Info
      : LogLevels.Debug
  });

  private readonly baseTrackerApiUrl: string = TRACKER_DOMAIN;

  private readonly trackerApiUrlV2: string = `${this.baseTrackerApiUrl}/api/v2`;

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

  // Utils
  async getRankHistory(userId: string, season: typeof Seasons[number]['value'] = Seasons[Seasons.length - 1].value, limit = Infinity) {
    const history: MatchHistory[] = [];
    let data: MatchHistoryDTO | null;
    let page = 0;
    do {
      data = await this.getMatchHistory(userId, {
        page,
        season,
        game_mode: 2 // ranked
      });
      if (data?.match_history.length) {
        history.push(...data.match_history);
      }
      if (data) {
        page++;
      }
    } while (data?.pagination.has_more && history.length < limit);

    return limit === Infinity
      ? history
      : history.slice(0, limit);
  }

  async getAllHistory(userId: string, options?: Omit<NonNullable<Parameters<typeof this['getMatchHistory']>[1]>, 'limit'>) {
    const history: MatchHistory[] = [];
    let data: MatchHistoryDTO | null;
    let page = options?.page
      ? options.page - 1
      : 0;
    do {
      data = await this.getMatchHistory(userId, {
        ...options,
        page
      });
      if (data?.match_history.length) {
        history.push(...data.match_history);
      }
      if (data) {
        page++;
      }
    } while (data?.pagination.has_more);

    return history;
  }

  // Maps
  public getMaps(page: number) {
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: 'maps',
      validator: validateMaps,
      cacheKey: 'maps',
      expireTime: 24 * 60 * 60,
      route: 'maps',
      query: {
        page
      }
    });
  }

  public async getAllMaps() {
    const maps: MapDTO[] = [];
    let data: MapsDTO | null;
    let page = 1;
    do {
      data = await this.getMaps(page++);
      if (data) {
        maps.push(...data.maps);
      }
    } while (data?.maps.length);
    return maps;
  }

  // Patch Notes
  public getPatchNotesById(id: string) {
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: `patch-note/${id}`,
      validator: validateFormattedPatch,
      cacheKey: `patch-note/${id}`,
      expireTime: 24 * 60 * 60,
      route: 'patch-note/:id'
    });
  }

  public getPatchNotes(page = 1) {
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: 'patch-notes',
      validator: validatePatchNotes,
      cacheKey: 'patch-notes',
      expireTime: 24 * 60 * 60,
      query: {
        page
      },
      route: 'patch-notes'
    });
  }

  public async getAllPatchNotes() {
    let data: PatchNotesDTO | null;
    let page = 1;
    const patchNotes: FormattedPatch[] = [];
    do {
      data = await this.getPatchNotes(page++);
      if (data) {
        patchNotes.push(...data.formatted_patches);
      }
    } while (data?.formatted_patches.length === data?.total_patches);
    return patchNotes;
  }

  // Matches
  public getMatchHistory(userNameOrId: string, options: {
    season?: typeof Seasons[number]['value'];
    page?: number;
    limit?: number;
    skip?: number;
    game_mode?: typeof GameModes[number]['value'];
    timestamp?: number;
  } = {}) {
    options = MergeOptions({
      season: Seasons[Seasons.length - 1].value,
      page: 1,
      limit: 40,
      skip: 0,
      game_mode: 0,
      timestamp: undefined
    }, options);

    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV2,
      endpoint: `player/${encodeURIComponent(userNameOrId)}/match-history`,
      validator: validateMatchHistory,
      cacheKey: `match-history/${userNameOrId}`,
      expireTime: 5 * 60,
      route: 'match-history/:id',
      query: options
    });
  }

  // Players
  updatePlayer(id: number | string) {
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: `player/${id}/update`,
      validator: validateUpdatedPlayer,
      route: 'player/:id/update'
    });
  }

  public searchPlayer(username: string) {
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: `find-player/${encodeURIComponent(username)}`,
      validator: validateFoundPlayer,
      cacheKey: `find-player/${username}`,
      expireTime: 30 * 60,
      route: 'find-player/:id'
    });
  }

  public async getPlayer(nameOrId: string, options?: Parameters<typeof this.fetchPlayer>[1]) {
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
    season?: typeof Seasons[number]['value'];
  } = {}) {
    options = MergeOptions({
      season: Seasons[Seasons.length - 1].value
    }, options);
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: `player/${id}`,
      validator: validatePlayer,
      cacheKey: `player/${id}`,
      expireTime: 5 * 60,
      route: 'player/:id',
      query: options
    });
  }

  // Heroes
  public getLeaderboardHero(nameOrId: string, platform: 'xbox' | 'pc' | 'ps' = 'pc') {
    return this.fetchWithRetry({
      domain: this.marvelRivalsApiUrlV1,
      endpoint: `heroes/leaderboard/${nameOrId}`,
      validator: validateLeaderboardPlayerHero,
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
      validator: validateHeroes,
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
      validator: validateHero,
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
    route,
    retries = 3,
    tries = 0
  }: {
    endpoint: string;
    domain: Api['marvelRivalsApiUrlV1' | 'marvelRivalsApiUrlV2' | 'trackerApiUrlV2'];
    route: string;
    validator: (data: unknown) => IValidation<T>;
    cacheKey?: string;
    query?: Record<string, undefined | string | number>;
    retries?: number;
    tries?: number;
    expireTime?: number;
  }): Promise<null | T> {
    if (cacheKey) {
      cacheKey = `${cacheKey}${query
        ? Object.entries(query).filter((kv): kv is [string, string | number] => kv.at(1) !== undefined).map((kv) => `${kv[0]}${kv[1]}`).join('_')
        : ''}`;
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
      if (tries < retries) {
        this.logger.warn(`Retrying ${endpoint}... (${tries + 1}/${retries})`);
        return this.fetchWithRetry({
          domain,
          cacheKey,
          endpoint,
          validator,
          query,
          expireTime,
          route,
          retries,
          tries: tries + 1
        });
      }
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

  private async fetchApi({ domain, endpoint, query, route }: {
    domain: Api['marvelRivalsApiUrlV1' | 'marvelRivalsApiUrlV2'];
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
          bucket.remaining = Number(xRatelimitRemaining) - 1;
          bucket.limit = Number(xRatelimitLimit) - 1;
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

  // tracker
  autocompletePlayerNames(query: string) {
    return this.fetchWithRetry({
      domain: this.trackerApiUrlV2,
      endpoint: 'marvel-rivals/standard/search',
      validator: validateAutocompletePlayerNames,
      route: 'marvel-rivals/standard/search',
      query: {
        platform: 'ign',
        query,
        autocomplete: 'true'
      },
      cacheKey: `autocomplete/${query}`,
      expireTime: 12 * 60 * 60
    });
  }
}
