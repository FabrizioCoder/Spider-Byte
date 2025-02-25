import { type ParseMiddlewares, type ParseLocales, type ParseClient, type UsingClient, Formatter, Client } from 'seyfert';
import { PresenceUpdateStatus, ActivityType, MessageFlags } from 'seyfert/lib/types';
import { basename, join, sep } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';

import type { Ratelimit } from './middlewares/cooldown';

import { middlewares } from './middlewares';
import { Api } from './lib/managers/api';

// Register fonts
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'RefrigeratorDeluxe.otf'), 'RrefrigeratorDeluxe');
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'RefrigeratorDeluxeBold.otf'), 'RefrigeratorDeluxeBold');
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'leaderboard.ttf'), 'leaderboard');

const client = new Client({
    commands: {
        defaults: {
            onRunError(ctx, error) {
                const errorId = Math.floor(Math.random() * 1_000_000);
                client.logger.error(
                    errorId,
                    ctx.author.id,
                    ctx.author.username,
                    ctx.fullCommandName,
                    error
                );

                const content = [
                    `Report this error on the [support server](<https://discord.gg/AcruVkyYHm>) with the ID \`${errorId}\`.`,
                    Formatter.codeBlock(error instanceof Error
                        ? error.stack ?? error.message
                        : String(error) || 'Unknown error', 'ts')
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
                    content: Object.values(metadata)[0].value as string || 'Unknown error. Try again.',
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

client.api = new Api((await client.getRC()).apiKeys);

await client.api.getHeroes();

await client.start();

await client.uploadCommands({
    cachePath: join(process.cwd(), 'cache', 'seyfert_commands.json')
});

declare module 'seyfert' {
    interface RegisteredMiddlewares
        extends ParseMiddlewares<typeof middlewares> { }

    interface ExtendedRC {
        apiKeys: string[];
    }

    interface UsingClient extends ParseClient<Client<true>> {
        api: Api;
    }

    interface DefaultLocale extends ParseLocales<typeof import('./locales/en-US/_')['default']> { }

    interface ExtraProps {
        ratelimit?: Ratelimit;
    }
}
