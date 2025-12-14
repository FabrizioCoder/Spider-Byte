import type { CommandContext, OKFunction } from 'seyfert';

import { createIntegerOption, createStringOption, createNumberOption, SubCommand, LocalesT, Declare, Options } from 'seyfert';

import { createMatchHistoryImage, GameModes } from '../../utils/images/match-history';
import { autocompleteUserCallback } from '../../utils/callbacks';
import { callbackPaginator } from '../../utils/paginator';
import { Seasons } from '../../utils/constants';

const options = {
    'name-or-id': createStringOption({
        description: 'The player name or ID to view match history for.',
        async value({ context, value }, ok: OKFunction<string>, fail) {
            const data = await context.client.api.searchPlayer(value);
            if (!data) {
                fail(context.t.commands.commonErrors.playerNotFound.get()); return;
            }
            ok(data.uid);
        },
        locales: {
            name: 'commands.commonOptions.nameOrId.name',
            description: 'commands.commonOptions.nameOrId.description'
        },
        autocomplete: autocompleteUserCallback
    }),
    season: createNumberOption({
        description: 'Season',
        choices: Seasons,
        locales: {
            name: 'commands.commonOptions.season.name',
            description: 'commands.commonOptions.season.description'
        }
    }),
    page: createIntegerOption({
        description: 'Page number in pagination',
        locales: {
            name: 'commands.commonOptions.page.name',
            description: 'commands.commonOptions.page.description'
        }
    }),
    skip: createIntegerOption({
        description: 'Number of matches to skip',
        locales: {
            name: 'commands.match.history.options.skip.name',
            description: 'commands.match.history.options.skip.description'
        }
    }),
    game_mode: createIntegerOption({
        description: 'Game mode',
        choices: GameModes,
        locales: {
            name: 'commands.commonOptions.gameMode.name',
            description: 'commands.commonOptions.gameMode.description'
        }
    })
};

@Declare({
    name: 'history',
    description: 'View match history for a specific player.'
})
@LocalesT('commands.match.history.name', 'commands.match.history.description')
@Options(options)
export default class History extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        const nameOrId = ctx.options['name-or-id'] || (await ctx.client.prisma.user.findFirst({
            where: {
                userID: ctx.author.id
            }
        }))?.rivalsUUID;
        if (!nameOrId) {
            return ctx.editOrReply({
                content: ctx.t.commands.commonErrors.noNameOrId.get()
            });
        }

        const player = await ctx.client.api.getPlayer(nameOrId);

        if (!player) {
            return ctx.editOrReply({
                content: ctx.t.commands.commonErrors.playerNotFound.get()
            });
        }
        const history = await ctx.client.api.getAllHistory(player.uid.toString(), {
            game_mode: ctx.options.game_mode,
            page: ctx.options.page,
            season: ctx.options.season,
            skip: ctx.options.skip
        });

        if (!history.length) {
            return ctx.editOrReply({
                content: ctx.t.commands.match.history.noHistory(player.name).get()
            });
        }

        await callbackPaginator(ctx, history, {
            async callback(chunk) {
                return {
                    files: [{
                        filename: 'history.png',
                        data: await createMatchHistoryImage(ctx.t, player, chunk, ctx.options.season, ctx.options.game_mode)
                    }]
                };
            },
            pageSize: 5
        });
    }

    onBeforeOptions(ctx: CommandContext) {
        return ctx.deferReply();
    }
}
