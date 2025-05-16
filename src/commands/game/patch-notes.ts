import { type CommandContext, AttachmentBuilder, SubCommand, LocalesT, Declare } from 'seyfert';
import { MessageFlags } from 'seyfert/lib/types';

import { scrapePatchNotes } from '../../utils/functions/scrapePatchNotes';
import { callbackPaginator } from '../../utils/paginator';

@Declare({
    name: 'patch-notes',
    description: 'Get the latest patch notes or patch notes for a specific id'
})
@LocalesT('commands.game.patchNotes.name', 'commands.game.patchNotes.description')
export default class RankCommand extends SubCommand {
    async run(ctx: CommandContext) {
        await ctx.deferReply();
        const patchNotesData = await scrapePatchNotes();
        if (!patchNotesData) {
            return ctx.editOrReply({
                content: ctx.t.commands.game.patchNotes.noPatchNotes.get()
            });
        }

        const { title, date, content, metadata } = patchNotesData;
        const header = `# [${title}](<${metadata.url}>)\nRelease Date: ${date}\n\n`;
        const img = new AttachmentBuilder()
            .setFile('url', patchNotesData.metadata.imageUrl)
            .setName('patch-notes.png');

        const fullContent = content.join('\n');
        if (fullContent.length + header.length <= 2_000) {
            return ctx.editOrReply({
                content: header + fullContent,
                flags: MessageFlags.SuppressEmbeds,
                files: [img]
            });
        }

        const chunks: string[] = [];
        let currentChunk = '';

        for (const line of content) {
            if (currentChunk.length + line.length + 1 > 1_750) {
                chunks.push(currentChunk);
                currentChunk = line;
            } else {
                currentChunk += (currentChunk
                    ? '\n'
                    : '') + line;
            }
        }
        if (currentChunk) {
            chunks.push(currentChunk);
        }

        await ctx.editOrReply({
            content: `${header}${chunks[0]}`,
            flags: MessageFlags.SuppressEmbeds,
            files: [img]
        });

        await callbackPaginator(ctx, chunks, {
            callback: (chunk) => ({
                content: `${header}${chunk[0]}`,
                flags: MessageFlags.SuppressEmbeds,
                files: [img]
            }),
            pageSize: 1
        });
    }
}
