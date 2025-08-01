import { createEvent } from 'seyfert';
import { inspect } from 'node:util';

const cuties = new Set([
    '507367752391196682',
    '221399196480045056',
    '1377618137645842533'
]);

export default createEvent({
    data: {
        name: 'messageCreate'
    },
    async run(message) {
        const mention = message.client.me.toString();
        if (
            !(
                message.content.startsWith(mention) &&
                cuties.has(message.author.id)
            )
        ) {
            return;
        }
        let evalResult: unknown;
        try {
            evalResult = await eval(`(async () => {${message.content.slice(mention.length)}})()`);
        } catch (error) {
            evalResult = error;
        }
        evalResult = inspect(evalResult, { depth: 1 });
        return message.reply({
            content: `\`\`\`js\n${(evalResult as string)
                .replaceAll(message.client.rest.options.token, '[REDACTED]')
                .slice(0, 1_800)}\`\`\``
        });
    }
});
