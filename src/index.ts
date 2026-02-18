import {
  type ParseMiddlewares,
  type ParseLocales,
  type ParseClient,
  type UsingClient,
  Formatter,
  Client
} from 'seyfert';
import {
  PresenceUpdateStatus,
  ActivityType,
  MessageFlags
} from 'seyfert/lib/types';
import { basename, join, sep } from 'node:path';
import { Api as TopGGAPI } from '@top-gg/sdk';
import { GlobalFonts } from '@napi-rs/canvas';
import { createClient } from '@redis/client';
import { AttachmentBuilder } from 'seyfert';

import type { Ratelimit } from './middlewares/cooldown';

import { WEBHOOK_TOKEN, TOPGG_TOKEN, WEBHOOK_ID, API_KEY } from './utils/env';
import { PrismaClient } from '../prisma/client';
import { middlewares } from './middlewares';
import { Api } from './lib/managers/api';
// Register fonts
GlobalFonts.registerFromPath(
  join(process.cwd(), 'assets', 'fonts', 'Inter', 'Inter_28pt-Regular.ttf'),
  'InterRegular'
);
GlobalFonts.registerFromPath(
  join(process.cwd(), 'assets', 'fonts', 'Inter', 'Inter_28pt-Black.ttf'),
  'InterBlack'
);
GlobalFonts.registerFromPath(
  join(process.cwd(), 'assets', 'fonts', 'Inter', 'Inter_28pt-SemiBold.ttf'),
  'InterSemiBold'
);
GlobalFonts.registerFromPath(
  join(process.cwd(), 'assets', 'fonts', 'Inter', 'Inter_28pt-Bold.ttf'),
  'InterBold'
);
GlobalFonts.registerFromPath(
  join(process.cwd(), 'assets', 'fonts', 'RefrigeratorDeluxeBold.otf'),
  'RefrigeratorDeluxeBold'
);
GlobalFonts.registerFromPath(
  join(process.cwd(), 'assets', 'fonts', 'leaderboard.ttf'),
  'leaderboard'
);

const client = new Client({
  commands: {
    defaults: {
      async onRunError(ctx, error) {
        let files: AttachmentBuilder[] | undefined;
        if (ctx.isChat() && ctx.interaction.data.options?.length) {
          files = [
            new AttachmentBuilder()
              .setFile(
                'buffer',
                Buffer.from(
                  JSON.stringify(ctx.interaction.data.options, null, 2)
                )
              )
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
          Formatter.codeBlock(
            (error instanceof Error
              ? error.message
              : typeof error === 'object' &&
                error &&
                'message' in error &&
                typeof error.message === 'string'
                ? error.message
                : typeof error === 'string'
                  ? error
                  : 'Unknown error'
            ).slice(0, 1_500),
            'ts'
          )
        ];

        if (content[1].includes('This player\'s profile is private.')) {
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

        void ctx.client.webhooks
          .writeMessage(WEBHOOK_ID, WEBHOOK_TOKEN, {
            body: {
              content: content.slice(1).join('\n'),
              embeds: [
                {
                  description: [
                    ctx.author.id,
                    ctx.author.username,
                    ctx.fullCommandName
                  ].join(' | ')
                }
              ],
              files
            }
          })
          .catch((err: unknown) => {
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
          content: Object.entries(metadata)
            .filter(([, value]) => value.failed)
            .map(([key, value]) => `${key}: ${value.value as string}`)
            .join('\n'),
          flags: MessageFlags.Ephemeral
        });
      },
      async onAfterRun(ctx) {
        if (Math.random() < 0.15) {
          const hasVoted = await ctx.client.topgg
            .hasVoted(ctx.author.id)
            .catch(() => false);
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
      activities: [
        {
          name: 'Gonna get sticky!',
          type: ActivityType.Custom,
          state: 'Gonna get sticky!'
        }
      ],
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

client.langs.onFile = (locale, { path, file }) => file.default
  ? {
    file: file.default,
    locale: path.split(sep).at(-2) ?? locale
  }
  : false;

client.redis = createClient();
await client.redis
  .on('error', (err) => {
    client.logger.error('Redis Client Error', err);
  })
  .connect();

client.prisma = new PrismaClient();

await client.prisma.$connect();

client.api = new Api(API_KEY, client.redis);

client.topgg = new TopGGAPI(TOPGG_TOKEN);

// await client.api.getHeroes();
//
// await client.api.getAllMaps();

await client.start();

await client.uploadCommands({
  cachePath: join(process.cwd(), 'cache', 'seyfert_commands.json')
});

declare module 'seyfert' {
  interface RegisteredMiddlewares extends ParseMiddlewares<
    typeof middlewares
  > { }

  interface UsingClient extends ParseClient<Client<true>> {
    api: Api;
    redis: ReturnType<typeof createClient>;
    topgg: TopGGAPI;
    prisma: PrismaClient;
  }

  interface DefaultLocale extends ParseLocales<
    (typeof import('./locales/en-US/_'))['default']
  > { }

  interface ExtraProps {
    ratelimit?: Ratelimit;
  }
}
