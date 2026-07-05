import { type CommandContext, SubCommand, LocalesT, Declare } from 'seyfert';

@Declare({
    name: 'unlink',
    description: 'Unlink your game account from your Discord account.'
})
@LocalesT('commands.account.unlink.name', 'commands.account.unlink.description')
export default class UnlinkCommand extends SubCommand {
    override async run(ctx: CommandContext) {
        await ctx.deferReply();

        const linkedAccount = await ctx.client.prisma.user.findFirst({
            where: {
                userID: ctx.author.id
            }
        });
        if (!linkedAccount) {
            return ctx.editOrReply({
                content: ctx.t.commands.account.unlink.notLinked.get()
            });
        }

        await ctx.client.prisma.user.delete({
            where: {
                userID: ctx.author.id
            }
        });
        return ctx.editOrReply({
            content: ctx.t.commands.account.unlink.success(linkedAccount.rivalsUUID).get()
        });
    }
}
