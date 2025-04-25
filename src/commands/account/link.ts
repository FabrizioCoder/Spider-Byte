import { type CommandContext, createStringOption, SubCommand, LocalesT, Declare, Options } from 'seyfert';

const options = {
    'name-or-id': createStringOption({
        description: 'Enter the player name or ID to identify the player.',
        locales: {
            description: 'commands.commonOptions.nameOrId'
        }
    })
};

@Declare({
    name: 'link',
    description: 'Link your game account to your Discord account.'
})
@LocalesT('commands.account.link.name', 'commands.account.link.description')
@Options(options)
export default class LinkCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        await ctx.deferReply();

        const nameOrId = ctx.options['name-or-id'];
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

        const alreadyLinked = await ctx.client.prisma.user.findFirst({
            where: {
                userID: ctx.author.id
            }
        });
        if (alreadyLinked) {
            return ctx.editOrReply({
                content: ctx.t.commands.account.link.alreadyLinked.get()
            });
        }

        await ctx.client.prisma.user.create({
            data: {
                userID: ctx.author.id,
                rivalsUUID: player.uid.toString()
            }
        });
        return ctx.editOrReply({
            content: ctx.t.commands.account.link.success(player.name, player.uid).get()
        });
    }
}
