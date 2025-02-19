import { type CommandContext, createStringOption, SubCommand, Formatter, LocalesT, Declare, Options, Embed } from 'seyfert';

import { callbackPaginator } from '../../utils/paginator';

const options = {
    id: createStringOption({
        description: 'The patch notes id',
        required: false,
        locales: {
            description: 'commands.game.patchNotes.options.id'
        }
    })
};

@Declare({
    name: 'patch-notes',
    description: 'Get the latest patch notes or patch notes for a specific id'
})
@LocalesT('commands.game.patchNotes.name', 'commands.game.patchNotes.description')
@Options(options)
export default class RankCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        await ctx.deferReply();

        const baseEmbed = new Embed()
            .setAuthor({
                name: 'Marvel Rivals',
                iconUrl: 'https://cdn2.steamgriddb.com/icon/916030603cc86a9b3d29f4d64f1bc415/32/256x256.png'
            })
            .setColor('Blurple');

        const id = ctx.options.id;
        if (id) {
            const patchData = await ctx.client.api.getPatchNotesById(id);
            if (!patchData) {
                return ctx.editOrReply({
                    content: ctx.t.commands.game.patchNotes.notFound(Formatter.inlineCode(id)).get()
                });
            }

            const embed = baseEmbed
                .setTitle(patchData.title)
                .setDescription(patchData.overview)
                .setImage(ctx.client.api.buildImage(patchData.imagePath));

            return ctx.editOrReply({ embeds: [embed] });
        }

        const patchData = await ctx.client.api.getPatchNotes();

        if (!patchData) {
            return ctx.editOrReply({
                content: ctx.t.commands.game.patchNotes.noPatchNotes.get()
            });
        }

        await ctx.editOrReply({
            embeds: [
                baseEmbed
                    .setTitle(patchData.formatted_patches[0].title)
                    .setDescription(patchData.formatted_patches[0].overview)
                    .setImage(ctx.client.api.buildImage(patchData.formatted_patches[0].imagePath))
                    .setFooter({
                        text: `Page 1/${patchData.formatted_patches.length} | ${patchData.formatted_patches[0].date}`
                    })
            ]
        });

        await callbackPaginator(ctx, patchData.formatted_patches, {
            callback(chunk, pageIndex) {
                const selected = chunk[0];
                const embed = baseEmbed
                    .setTitle(selected.title)
                    .setDescription(selected.overview)
                    .setImage(ctx.client.api.buildImage(selected.imagePath))
                    .setFooter({
                        text: `Page ${pageIndex + 1}/${patchData.formatted_patches.length} | ${selected.date}`
                    });

                return { embeds: [embed] };
            },
            pageSize: 1
        });
    }
}
