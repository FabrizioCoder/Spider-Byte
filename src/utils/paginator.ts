import type { ComponentInteractionMessageUpdate, PickPartial, Awaitable } from 'seyfert/lib/common';
import type { APIButtonComponentWithCustomId } from 'seyfert';
import type { ButtonInteraction } from 'seyfert';

import { type ListenerOptions, type CommandContext, ActionRow } from 'seyfert';
import { DynamicBucket } from 'seyfert/lib/websocket/structures';
import { ComponentType, ButtonStyle } from 'seyfert';

export async function callbackPaginator<T>(ctx: CommandContext, data: T[], options: {
    callback: (data: T[], pageIndex: number) => Awaitable<ComponentInteractionMessageUpdate>;
    pageSize: number;
} & ListenerOptions = {
        callback() {
            return {};
        },
        pageSize: 10
    }) {
    const chunks = DynamicBucket.chunk(data, options.pageSize);
    const firstChunk = chunks.at(0);
    if (!firstChunk) {
        throw new Error('No data to paginate');
    }

    await ctx.editOrReply({
        ...await options.callback(firstChunk, 0),
        components: [createButtonRow(chunks, 0)]
    }, true);

    options.idle ??= 60e3;
    let pageIndex = 0;
    const message = await ctx.editOrReply({
        components: [createButtonRow(chunks, pageIndex)]
    }, true);

    const collector = message.createComponentCollector({
        filter(interaction) {
            return interaction.user.id === ctx.author.id;
        },
        async onStop(reason) {
            if (reason === 'idle' || reason === 'timeout') {
                await ctx.editResponse({
                    components: [createButtonRow(chunks, pageIndex, true)]
                }).catch(() => null);
            }
        },
        ...options
    });

    collector.run<ButtonInteraction>('first', async (interaction) => {
        pageIndex = 0;
        const content = await options.callback(chunks[pageIndex], pageIndex);
        content.components = [createButtonRow(chunks, pageIndex)];
        await ctx.editResponse(content);
        await interaction.deferUpdate().catch(() => null);
    });
    collector.run<ButtonInteraction>('back', async (interaction) => {
        pageIndex--;
        const content = await options.callback(chunks[pageIndex], pageIndex);
        content.components = [createButtonRow(chunks, pageIndex)];
        await ctx.editResponse(content);
        await interaction.deferUpdate().catch(() => null);
    });
    collector.run<ButtonInteraction>('stop', async () => {
        collector.stop('user_interaction');
        const content = await options.callback(chunks[pageIndex], pageIndex);
        content.components = [createButtonRow(chunks, pageIndex, true)];
        await ctx.editResponse(content);
    });
    collector.run<ButtonInteraction>('next', async (interaction) => {
        pageIndex++;
        const content = await options.callback(chunks[pageIndex], pageIndex);
        content.components = [createButtonRow(chunks, pageIndex)];
        await ctx.editResponse(content);
        await interaction.deferUpdate().catch(() => null);
    });
    collector.run<ButtonInteraction>('last', async (interaction) => {
        pageIndex = chunks.length - 1;
        const content = await options.callback(chunks[pageIndex], pageIndex);
        content.components = [createButtonRow(chunks, pageIndex)];
        await ctx.editResponse(content);
        await interaction.deferUpdate().catch(() => null);
    });
}

function createButton(data: PickPartial<Omit<APIButtonComponentWithCustomId, 'type'>, 'style'>) {
    return {
        style: ButtonStyle.Danger,
        ...data,
        type: ComponentType.Button
    } satisfies APIButtonComponentWithCustomId;
}

function createButtonRow<T>(chunks: T[][], pageIndex = 0, disabled?: true) {
    const buttons: APIButtonComponentWithCustomId[] = [
        createButton({
            custom_id: 'first',
            label: 'First',
            disabled: pageIndex === 0 || disabled
        }),
        createButton({
            custom_id: 'back',
            label: '◀️',
            disabled: pageIndex === 0 || disabled
        }),
        createButton({
            custom_id: 'next',
            label: '▶️',
            disabled: pageIndex + 1 === chunks.length || disabled
        }),
        createButton({
            custom_id: 'last',
            label: 'Last',
            disabled: pageIndex + 1 === chunks.length || disabled
        }),
        createButton({
            custom_id: 'stop',
            label: '🛑',
            disabled
        })
    ];

    return new ActionRow({
        components: buttons
    });
}
