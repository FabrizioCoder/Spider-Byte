import type { CommandContext } from 'seyfert';

import { createStringOption, SubCommand, LocalesT, Declare, Options } from 'seyfert';

import { autocompleteUserCallback } from '../../utils/callbacks';

const options = {
    name: createStringOption({
        description: 'Enter the player name or ID to identify the player.',
        locales: {
            name: 'commands.commonOptions.name.name',
            description: 'commands.commonOptions.name.description'
        },
        autocomplete: autocompleteUserCallback
    })
};

@Declare({
    name: 'update',
    description: 'Update a player\'s stats.',
    props: {
        ratelimit: {
            time: 15e3,
            type: 'user'
        }
    }
})
@LocalesT('commands.player.update.name', 'commands.player.update.description')
@Options(options)
export default class UpdateCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        await ctx.deferReply(true);

        const nameOrId = ctx.options.name || (await ctx.client.prisma.user.findFirst({
            where: {
                userID: ctx.author.id
            }
        }))?.rivalsUsername;
        if (!nameOrId) {
            return ctx.editOrReply({
                content: ctx.t.commands.commonErrors.noName.get()
            });
        }

        const cacheKey = `command:update/${nameOrId}`;

        if (await ctx.client.redis.EXISTS(cacheKey)) {
            return ctx.editOrReply({
                content: ctx.t.commands.player.update.updatedRecently(
                    nameOrId
                ).get()
            });
        }

        const player = await ctx.client.api.searchPlayer(nameOrId);
        if (!player) {
            return ctx.editOrReply({
                content: ctx.t.commands.commonErrors.playerNotFound.get()
            });
        }

        const result = await ctx.client.api.updatePlayer(player.uid);
        if (!result?.success) {
            return ctx.editOrReply({
                content: ctx.t.commands.player.update.cantUpdate(
                    player.name,
                    player.uid
                ).get()
            });
        }

        await ctx.client.redis.SET(cacheKey, '1', {
            EX: 60 * 60
        });

        return ctx.editOrReply({
            content: ctx.t.commands.player.update.success(
                player.name,
                player.uid
            ).get()
        });
    }
}
