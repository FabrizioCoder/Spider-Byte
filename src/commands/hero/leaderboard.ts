import type { CommandContext, OKFunction } from 'seyfert';

import { createStringOption, SubCommand, LocalesT, Declare, Options } from 'seyfert';
import didYouMean, { ReturnTypeEnums } from 'didyoumean2';

import type { LeaderboardPlayerHeroDTO } from '../../types/dtos/LeaderboardPlayerHeroDTO';

import { generateLeaderboard } from '../../utils/images/leaderboard';
import { callbackPaginator } from '../../utils/paginator';

const options = {
    hero: createStringOption({
        description: 'The hero you want to get information about',
        async autocomplete(interaction) {
            const heroes = await interaction.client.api.getHeroes();
            const result = didYouMean(interaction.getInput(), heroes.map((hero) => hero.name), {
                returnType: ReturnTypeEnums.ALL_SORTED_MATCHES,
                threshold: 0.1
            }).slice(0, 25);

            if (result.length) {
                return interaction.respond(result.map((heroName) => ({
                    name: heroName,
                    value: heroName
                })));
            }

            return interaction.respond(heroes.slice(0, 25).map((hero) => ({
                name: hero.name,
                value: hero.name
            })));
        },
        async value({ value, context: ctx }, ok: OKFunction<LeaderboardPlayerHeroDTO>, fail) {
            const hero = (await ctx.client.api.getHeroes()).find((h) => h.name === value);
            if (!hero) {
                fail(`Invalid hero ${value}`); return;
            }

            const leaderboard = await ctx.client.api.getLeaderboardHero(String(hero.id));
            if (!leaderboard) {
                fail('404 xdxd'); return;
            }

            ok(leaderboard);
        },
        required: true,
        locales: {
            description: 'commands.hero.leaderboard.options.hero'
        }
    })
};

@Declare({
    name: 'leaderboard',
    description: 'View the leaderboard for a specific hero.'
})
@LocalesT('commands.hero.leaderboard.name', 'commands.hero.leaderboard.description')
@Options(options)
export default class Ping extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        await ctx.deferReply();

        await ctx.editOrReply({
            files: [{
                filename: 'leaderboard.png',
                data: await generateLeaderboard(ctx.options.hero.players, 0)
            }]
        });

        await callbackPaginator(ctx, ctx.options.hero.players, {
            async callback(chunk, pageIndex) {
                return {
                    files: [{
                        filename: 'leaderboard.png',
                        data: await generateLeaderboard(chunk, pageIndex)
                    }]
                };
            },
            pageSize: 9
        });
    }
}
