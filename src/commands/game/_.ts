import { LocalesT, AutoLoad, Declare, Command } from 'seyfert';

@Declare({
    name: 'game',
    description: 'Access game maps information and latest patch notes',
    contexts: ['BotDM', 'Guild', 'PrivateChannel'],
    integrationTypes: ['GuildInstall', 'UserInstall'],
    props: {
        ratelimit: {
            time: 7_000,
            type: 'user'
        }
    }
})
@AutoLoad()
@LocalesT('commands.game.name', 'commands.game.description')
export default class GameCommand extends Command { }
