import type { CommandContext, OKFunction } from 'seyfert';

import { createStringOption, SubCommand, Declare, Options } from 'seyfert';
import didYouMean, { ReturnTypeEnums } from 'didyoumean2';

import type { LeaderboardPlayerHeroDTO } from '../../types/dtos/LeaderboardPlayerHeroDTO';

const options = {
    query: createStringOption({
        description: 'The hero you want to get information about',
        async autocomplete(interaction) {
            const heroes = await interaction.client.api.getHeroes();
            const result = didYouMean(interaction.getInput(), heroes.map((hero) => hero.name), {
                returnType: ReturnTypeEnums.ALL_SORTED_MATCHES,
                threshold: 0.1
            }).slice(0, 25);

            return interaction.respond(result.map((heroName) => ({
                name: heroName,
                value: heroName
            })));
        },
        async value({ value, context: ctx }, ok: OKFunction<LeaderboardPlayerHeroDTO>, fail) {
            const hero = (await ctx.client.api.getHeroes()).find((h) => h.name === value);
            if (!hero) {
                fail(`Invalid hero ${value}`); return;
            }

            const leaderboard = await ctx.client.api.getLeaderboardHero(hero.id);
            if (!leaderboard) {
                fail('404 xdxd'); return;
            }

            ok(leaderboard);
        },
        required: true
    })
};

@Declare({
    name: 'leaderboard',
    description: 'View a specific heros leaderboard'
})
@Options(options)
export default class Ping extends SubCommand {
    run(ctx: CommandContext<typeof options>) {
        console.log(ctx.options.query, '???');
    }
}
