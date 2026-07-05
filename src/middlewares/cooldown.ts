import type { Snowflake } from 'seyfert';

import { createMiddleware, Formatter } from 'seyfert';
import { LimitedCollection } from 'seyfert';

const cooldowns = new LimitedCollection<Snowflake, Ratelimit>({});
const whitelist = new Set(['507367752391196682', '221399196480045056']);

export default createMiddleware<undefined>(({ context, next, stop }) => {
    if (whitelist.has(context.author.id)) {
        next(); return;
    }
    if (!context.isChat()) {
        stop('pass'); return;
    }
    const commandCooldown = context.resolver.parent?.props.ratelimit;
    if (!commandCooldown) {
        next(); return;
    }

    const commmandName = context.resolver.fullCommandName;

    const id =
        commandCooldown.type === 'channel'
            ? context.interaction.channel.id
            : context.author.id;
    const key = `${id}:${commmandName}`;

    const currentCooldown = cooldowns.raw(key);
    if (!currentCooldown) {
        cooldowns.set(key, commandCooldown, commandCooldown.time);
        next(); return;
    }

    const timeLeft = (currentCooldown.expireOn - Date.now()) / 1_000;
    switch (commandCooldown.type) {
        case 'channel':
            stop(context.t.commands.middlewares.cooldown.error.channel(
                Formatter.bold(`${timeLeft.toFixed(1)}s`)
            ).get());
            break;
        case 'user':
            stop(context.t.commands.middlewares.cooldown.error.user(
                Formatter.bold(`${timeLeft.toFixed(1)}s`)
            ).get());
            break;
    }

    next();
});

export interface Ratelimit {
    type: 'channel' | 'user';
    time: number;
}
