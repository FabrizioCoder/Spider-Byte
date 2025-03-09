import { type ParseMiddlewares, type ParseLocales, type ParseClient, type UsingClient, Formatter, Client } from 'seyfert';
import { PresenceUpdateStatus, ActivityType, MessageFlags } from 'seyfert/lib/types';
import { basename, join, sep } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';
import { createClient } from '@redis/client';

import type { Ratelimit } from './middlewares/cooldown';

import { middlewares } from './middlewares';
import { Api } from './lib/managers/api';
import { API_KEY } from './utils/env';

// Register fonts
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'RefrigeratorDeluxe.otf'), 'RefrigeratorDeluxe');
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'RefrigeratorDeluxeBold.otf'), 'RefrigeratorDeluxeBold');
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'leaderboard.ttf'), 'leaderboard');

const client = new Client({
    commands: {
        defaults: {
            onRunError(ctx, error) {
                client.logger.error(
                    ctx.author.id,
                    ctx.author.username,
                    ctx.fullCommandName,
                    error
                );

                let errorMessage = (error instanceof Error ? error.message : error) ?? "Unknown error"; // Yea cus users dont need to see the whole fucking error stack, ye, that goes for you MARCROCK

                const content = [
                    `*Ugh. I hate this part...* I ran into an error! Try again later and if the error persists, report it on my [support server](<https://discord.gg/AcruVkyYHm>) with the content above:`,
                    Formatter.codeBlock(errorMessage)
                ];

                return ctx.editOrReply({
                    content: content.join('\n')
                });
            },
            onMiddlewaresError(ctx, error) {
                return ctx.editOrReply({
                    content: error,
                    flags: MessageFlags.Ephemeral
                });
            },
            onOptionsError(ctx, metadata) {
                client.logger.error(
                    ctx.author.id,
                    ctx.author.username,
                    ctx.fullCommandName,
                    metadata
                );
                return ctx.editOrReply({
                    content: Object.entries(metadata).filter(([, value]) => value.failed).map(([key, value]) => `${key}: ${value.value as string}`).join('\n'),
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    },
    presence() {
        return {
            activities: [{
                name: 'Gonna get sticky',
                type: ActivityType.Custom,
                state: 'Gonna get sticky!'
            }],
            afk: false,
            since: Date.now(),
            status: PresenceUpdateStatus.Online
        };
    },
    globalMiddlewares: ['cooldown']
}) as UsingClient & Client;

client.setServices({
    langs: {
        aliases: {
            'es-419': ['es-ES'],
            'en-US': ['en-GB']
        }
    },
    middlewares
});

client.langs.filter = (path) => basename(path) === '_.ts';

client.langs.onFile = (locale, { path, file }) => file.default
    ? {
        file: file.default,
        locale: path.split(sep).at(-2) ?? locale
    }
    : false;


client.redis = await createClient()
    .on('error', (err) => {
        client.logger.error('Redis Client Error', err);
    }).connect();

client.api = new Api(API_KEY, client.redis);

await client.api.getHeroes();

await client.start();

await client.uploadCommands({
    cachePath: join(process.cwd(), 'cache', 'seyfert_commands.json')
});

declare module 'seyfert' {
    interface RegisteredMiddlewares
        extends ParseMiddlewares<typeof middlewares> { }

    interface ExtendedRC { }

    interface UsingClient extends ParseClient<Client<true>> {
        api: Api;
        redis: ReturnType<typeof createClient>;
    }

    interface DefaultLocale extends ParseLocales<typeof import('./locales/en-US/_')['default']> { }

    interface ExtraProps {
        ratelimit?: Ratelimit;
    }
}
