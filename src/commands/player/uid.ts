import type { CommandContext } from 'seyfert';

import { createStringOption, SubCommand, LocalesT, Declare, Options } from 'seyfert';

import { autocompleteUserCallback } from '../../utils/callbacks';

const options = {
    name: createStringOption({
        description: 'Enter the player name to identify the player.',
        locales: {
            name: 'commands.commonOptions.nameOrId.name',
            description: 'commands.commonOptions.nameOrId.description'
        },
        required: true,
        autocomplete: autocompleteUserCallback
    })
};

@Declare({
    name: 'uid',
    description: 'Get the player UID by the player name.'
})
@Options(options)
@LocalesT('commands.player.uid.name', 'commands.player.uid.description')
export default class RankCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        await ctx.deferReply();

        const nameOrId = ctx.options.name;
        const result = await ctx.client.api.searchPlayer(nameOrId);

        if (!result) {
            return ctx.editOrReply({
                content: ctx.t.commands.commonErrors.playerNotFound.get()
            });
        }

        await ctx.editOrReply({
            content: `**${result.name}** (${result.uid})`
        });
    }
}
