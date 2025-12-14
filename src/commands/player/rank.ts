import type { CommandContext } from 'seyfert';

import { createIntegerOption, createStringOption, createNumberOption, AttachmentBuilder, SubCommand, LocalesT, Declare, Options } from 'seyfert';
import { createIs } from 'typia';

import { type ExpectedScoreInfo, generateRankChart } from '../../utils/images/ranked';
import { autocompleteUserCallback } from '../../utils/callbacks';
import { Seasons } from '../../utils/constants';

const options = {
    'name-or-id': createStringOption({
        description: 'Enter the player name or ID to identify the player.',
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
    limit: createIntegerOption({
        description: 'The number of matches to display in the graph.',
        locales: {
            name: 'commands.player.rank.options.limit.name',
            description: 'commands.player.rank.options.limit.description'
        }
    })
};

const isExpectedScoreInfo = createIs<ExpectedScoreInfo>();

@Declare({
    name: 'rank',
    description: 'View a timeline graph of a player\'s rank history.'
})
@LocalesT('commands.player.rank.name', 'commands.player.rank.description')
@Options(options)
export default class RankCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        await ctx.deferReply();

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

        const player = await ctx.client.api.getPlayer(nameOrId, {
            season: ctx.options.season
        });
        if (!player) {
            return ctx.editOrReply({
                content: ctx.t.commands.commonErrors.playerNotFound.get()
            });
        }

        if (!player.rank_history.length) {
            return ctx.editOrReply({
                content: ctx.t.commands.player.rank.noRankHistory(player.player.name, player.player.team.club_team_mini_name).get()
            });
        }

        const matchHistory = await ctx.client.api.getRankHistory(player.uid.toString(), ctx.options.season, ctx.options.limit);

        const scoreInfo: ExpectedScoreInfo[] = [];

        for (const i of matchHistory) {
            const date = new Date(i.match_time_stamp * 1e3);
            const data = {
                add_score: i.match_player.score_info.add_score,
                level: i.match_player.score_info.level,
                match_time_stamp: i.match_time_stamp * 1e3,
                new_level: i.match_player.score_info.new_level,
                new_score: i.match_player.score_info.new_score,
                date: `${date.getMonth() + 1} ${date.getDay()}`
            };
            if (data.add_score !== 0 && isExpectedScoreInfo(data)) {
                scoreInfo.push(data);
            }
        }

        if (!scoreInfo.length) {
            return ctx.editOrReply({
                content: ctx.t.commands.player.rank.noRankData(player.player.name, player.player.team.club_team_mini_name).get()
            });
        }

        const bufferGraph = await generateRankChart(player, scoreInfo, ctx.options.season);

        return ctx.editOrReply({
            files: [
                new AttachmentBuilder()
                    .setName('rank.png')
                    .setFile('buffer', bufferGraph)
            ]
        });
    }
}
