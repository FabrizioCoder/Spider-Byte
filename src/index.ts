import { type ParseLocales, type ParseClient, definePlugins, Formatter, Client } from 'seyfert';
import { PresenceUpdateStatus, ActivityType, MessageFlags } from 'seyfert';
import { basename, join, sep } from 'node:path';
import { GlobalFonts } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'seyfert';

import type { Ratelimit } from './middlewares/cooldown';

import { WEBHOOK_TOKEN, WEBHOOK_ID } from './utils/env';
import { servicesPlugin } from './plugins/services';
import { middlewares } from './middlewares';
// Register fonts
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'Inter', 'Inter_28pt-Regular.ttf'), 'InterRegular');
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'Inter', 'Inter_28pt-Black.ttf'), 'InterBlack');
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'Inter', 'Inter_28pt-SemiBold.ttf'), 'InterSemiBold');
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'Inter', 'Inter_28pt-Bold.ttf'), 'InterBold');
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'RefrigeratorDeluxeBold.otf'), 'RefrigeratorDeluxeBold');
GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'fonts', 'leaderboard.ttf'), 'leaderboard');

const plugins = definePlugins(servicesPlugin());

const client = new Client({
    commands: {
        defaults: {
            async onRunError(ctx, error) {
                let files: AttachmentBuilder[] | undefined;
                if (ctx.isChat() && ctx.interaction.data.options?.length) {
                    files = [
                        new AttachmentBuilder()
                            .setFile('buffer', Buffer.from(JSON.stringify(ctx.interaction.data.options, null, 2)))
                            .setName('options.txt')
                    ];
                }

                client.logger.error(
                    ctx.author.id,
                    ctx.author.username,
                    ctx.fullCommandName,
                    error
                );

                const content = [
                    'Report this error on the [support server](<https://discord.gg/AcruVkyYHm>).',
                    Formatter.codeBlock((error instanceof Error
                        ? error.message
                        : typeof error === 'object' && error && 'message' in error && typeof error.message === 'string'
                            ? error.message
                            : typeof error === 'string'
                                ? error
                                : 'Unknown error').slice(0, 1_500), 'ts')
                ];

                if (content.at(1)?.includes('This player\'s profile is private.')) {
                    return ctx.editOrReply({
                        content: ctx.t.commands.commonErrors.privateProfile.get(),
                        files: [
                            {
                                data: await Bun.file(
                                    join(process.cwd(), 'assets', 'private-profile.png')
                                ).bytes(),
                                filename: 'private-profile.png'
                            }
                        ]
                    });
                }

                void ctx.client.webhooks.writeMessage(WEBHOOK_ID, WEBHOOK_TOKEN, {
                    body: {
                        content: content.slice(1).join('\n'),
                        embeds: [{
                            description: [
                                ctx.author.id,
                                ctx.author.username,
                                ctx.fullCommandName
                            ].join(' | ')
                        }],
                        files
                    }
                }).catch((err: unknown) => {
                    ctx.client.logger.error('webhook', err);
                });

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
            },
            async onAfterRun(ctx) {
                if (Math.random() < 0.15) {
                    const hasVoted = await ctx.client.topgg.hasVoted(ctx.author.id).catch(() => false);
                    if (!hasVoted) {
                        await ctx.followup({
                            content: ctx.t.commands.others.noVoted.get(),
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }
            }
        }
    },
    presence() {
        return {
            activities: [{
                name: 'Gonna get sticky!',
                type: ActivityType.Custom,
                state: 'Gonna get sticky!'
            }],
            afk: false,
            since: Date.now(),
            status: PresenceUpdateStatus.Online
        };
    },
    globalMiddlewares: ['cooldown'],
    plugins
});

client.setServices({
    langs: {
        aliases: {
            'es-419': ['es-ES'],
            'en-US': ['en-GB']
        },
        default: 'en-US'
    },
    middlewares,
    cache: {
        disabledCache: {
            messages: true
        }
    }
});

client.langs.filter = (path) => basename(path) === '_.ts';

client.langs.onFile = (locale, { path, file }) => file.default && path
    ? {
        file: file.default,
        locale: path.split(sep).at(-2) ?? locale
    }
    : false;


await client.start();

await client.uploadCommands({
    cachePath: join(process.cwd(), 'cache', 'seyfert_commands.json')
});

declare module 'seyfert' {
    interface SeyfertRegistry {
        client: ParseClient<Client<true>>;
        langs: ParseLocales<typeof import('./locales/en-US/_')['default']>;
        middlewares: typeof middlewares;
        plugins: typeof plugins;
    }

    interface ExtraProps {
        ratelimit?: Ratelimit;
    }
}
