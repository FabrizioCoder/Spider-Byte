import type { ApplicationEmojiStructure, CommandContext } from 'seyfert';
import type { MakeRequired } from 'seyfert/lib/common';

import didYouMean, { ReturnTypeEnums } from 'didyoumean2';

export async function getEmoji(
    ctx: CommandContext,
    input: string
): Promise<ApplicationEmojiStructure | null> {
    const emojis = await ctx.client.applications.listEmojis();

    if (!emojis.length) {
        return null;
    }

    const emojiNames = emojis
        .filter((emoji): emoji is MakeRequired<ApplicationEmojiStructure, 'name'> => !emoji.name)
        .map((emoji) => emoji.name);

    const result = didYouMean(input, emojiNames, {
        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES,
        threshold: 0.1
    }).slice(0, 5);

    if (!result.length) {
        return null;
    }
    const firstResult = result[0];

    const matchedEmoji = emojis.find((emoji) => emoji.name === firstResult);

    return matchedEmoji ?? null;
}
