import { type CommandContext, createStringOption, SubCommand, Declare, Options } from 'seyfert';

const options = {
  'name-or-id': createStringOption({
    description: 'player name or id'
  })
};

@Declare({
  name: 'profile',
  description: 'get player profile'
})
@Options(options)
export default class ProfileCommand extends SubCommand {
  async run(ctx: CommandContext<typeof options>) {
    await ctx.deferReply();

    const nameOrId = ctx.options['name-or-id'];
    if (!nameOrId) {
      return ctx.editOrReply({
        content: 'Please provide a player name or id'
      });
    }

    const player = await ctx.client.api.getPlayer(nameOrId);
    if (!player) {
      return ctx.editOrReply({
        content: 'Player not found. Please provide a valid player name or id'
      });
    }

    return ctx.editOrReply({
      content: [
        `**${player.name}${player.player.team.club_team_id === ''
          ? '** '
          : `#${player.player.team.club_team_mini_name}** `
        }(${player.uid})`,
        `Level: ${player.player.level}`,
        `Rank: ${player.player.rank.rank}`
      ].join('\n')
    });

  }
}
