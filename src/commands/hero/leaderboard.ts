import type { CommandContext, OKFunction } from 'seyfert';

import { createStringOption, SubCommand, LocalesT, Declare, Options } from 'seyfert';
import didYouMean, { ReturnTypeEnums } from 'didyoumean2';

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
        async value({ value, context: ctx }, ok: OKFunction<string>, fail) {
            const hero = (await ctx.client.api.getHeroes()).find((h) => h.name === value || h.id === value);
            if (!hero) {
                fail(`Invalid hero ${value}`); return;
            }

            ok(hero.id);
        },
        required: true,
        locales: {
            name: 'commands.hero.leaderboard.options.hero.name',
            description: 'commands.hero.leaderboard.options.hero.description'
        }
    }),
    platform: createStringOption({
        description: 'The platform you want to get information about',
        choices: [
            {
                name: 'PC',
                value: 'pc'
            },
            {
                name: 'PlayStation',
                value: 'ps'
            },
            {
                name: 'Xbox',
                value: 'xbox'
            }
        ] as const,
        locales: {
            name: 'commands.hero.leaderboard.options.platform.name',
            description: 'commands.hero.leaderboard.options.platform.description'
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
    override async run(ctx: CommandContext<typeof options>) {

        const leaderboard = await ctx.client.api.getLeaderboardHero(ctx.options.hero, ctx.options.platform);
        if (!leaderboard) {
            return ctx.editOrReply({
                content: ctx.t.commands.hero.leaderboard.notFound.get()
            });
        }

        await callbackPaginator(ctx, leaderboard.players, {
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

    override onBeforeOptions(ctx: CommandContext) {
        return ctx.deferReply();
    }
}
