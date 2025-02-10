import { type ParseLocales, type ParseClient, type UsingClient, Client } from 'seyfert';
import { PresenceUpdateStatus, ActivityType, MessageFlags } from 'seyfert/lib/types';
import { basename, join, sep } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';

import { isProduction } from './lib/constants';
import { Api } from './lib/managers/api';

// Register fonts
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'RefrigeratorDeluxe.ttf'), 'RrefrigeratorDeluxe');
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'RefrigeratorDeluxeBold.ttf'), 'RefrigeratorDeluxeBold');
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

                const content = `\`\`\`${error instanceof Error
                    ? error.stack ?? error.message
                    : String(error) || 'Unknown error'
                    }\`\`\``;

                return ctx.editOrReply({
                    content
                });
            },
            onMiddlewaresError(ctx, error) {
                return ctx.editOrReply({
                    content: error,
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
    }
}) as UsingClient & Client;

client.setServices({
    langs: {
        aliases: {
            'es-419': ['es-ES'],
            'en-US': ['en-GB']
        }
    }
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

if (isProduction) {
    const run = async () => {
        for (const i of await client.api.getHeroes()) {
            client.api.logger.info(`Caching ${i.name} leaderboard`);
            await client.api.getLeaderboardHero(i.id);
        }
    };
    void run();
    setInterval(() => {
        void run();
    }, 17 * 60e3);
}

await client.start();

await client.uploadCommands({
    cachePath: join(process.cwd(), 'cache', 'seyfert_commands.json')
});

declare module 'seyfert' {
    interface ExtendedRC {
        apiKeys: string[];
    }

    interface UsingClient extends ParseClient<Client<true>> {
        api: Api;
    }

    interface DefaultLocale extends ParseLocales<typeof import('./locales/en-US/_')['default']> { }
}
