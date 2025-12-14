import type { CommandContext } from 'seyfert';

import { createStringOption, SubCommand, LocalesT, Declare, Options } from 'seyfert';

import { autocompleteUserCallback } from '../../utils/callbacks';
import { generateCompare } from '../../utils/images/compare';

const options = {
    'name-or-id': createStringOption({
        description: 'first player name or id to compare',
        locales: {
            name: 'commands.player.compare.options.first.name',
            description: 'commands.player.compare.options.first.description'
        },
        autocomplete: autocompleteUserCallback
    }),
    'name-or-id2': createStringOption({
        description: 'second player name or id to compare',
        locales: {
            name: 'commands.player.compare.options.second.name',
            description: 'commands.player.compare.options.second.description'
        },
        autocomplete: autocompleteUserCallback
    })
};

@Declare({
    name: 'compare',
    description: 'Compare stats of two players, including ranks, roles, and top heroes.'
})
@LocalesT('commands.player.compare.name', 'commands.player.compare.description')
@Options(options)
export default class CompareCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        await ctx.deferReply();

        const firstNameOrId = ctx.options['name-or-id'];
        const secondNameOrId = ctx.options['name-or-id2'];
        if (!firstNameOrId || !secondNameOrId || firstNameOrId === secondNameOrId) {
            return ctx.editOrReply({
                content: ctx.t.commands.player.compare.samePlayer.get()
            });
        }

        const playerOne = await ctx.client.api.getPlayer(firstNameOrId);
        const playerTwo = await ctx.client.api.getPlayer(secondNameOrId);
        if (!playerOne || !playerTwo) {
            return ctx.editOrReply({
                content: ctx.t.commands.commonErrors.playerNotFound.get()
            });
        }

        if (playerOne.player.uid === playerTwo.player.uid) {
            return ctx.editOrReply({
                content: ctx.t.commands.player.compare.samePlayer.get()
            });
        }

        const image = await generateCompare([playerOne, playerTwo]);

        return ctx.editOrReply({
            files: [{
                data: image,
                filename: 'compare.png'
            }]
        });
    }
}
