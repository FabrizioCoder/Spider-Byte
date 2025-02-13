import { Middlewares, AutoLoad, Declare, Command } from 'seyfert';

import { ApplyCooldown } from '../../middlewares/cooldown';

@Declare({
    name: 'hero',
    description: 'hero commands',
    contexts: ['BotDM', 'Guild', 'PrivateChannel'],
    integrationTypes: ['GuildInstall', 'UserInstall']
})
@ApplyCooldown({
    time: 10_000,
    type: 'user'
})
@Middlewares(['cooldown'])
@AutoLoad()
export default class HeroCommand extends Command { }
