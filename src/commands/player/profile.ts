import { type CommandContext, createStringOption, AttachmentBuilder, SubCommand, LocalesT, Declare, Options } from 'seyfert';

import { generateProfileV1, generateProfileV2 } from '../../utils/images/profile';
import { autocompleteUserCallback } from '../../utils/callbacks';

const options = {
  'name-or-id': createStringOption({
    description: 'Enter the player name or ID to identify the player.',
    locales: {
      name: 'commands.commonOptions.nameOrId.name',
      description: 'commands.commonOptions.nameOrId.description'
    },
    autocomplete: autocompleteUserCallback
  }),
  'game-mode': createStringOption({
    description: 'Choose the game mode to display stats for.',
    required: false,
    choices: [
      {
        name: 'Ranked',
        value: 'ranked'
      },
      {
        name: 'Casual',
        value: 'casual'
      },
      {
        name: 'Both',
        value: 'both'
      }
    ] as const,
    locales: {
      name: 'commands.commonOptions.gameMode.name',
      description: 'commands.commonOptions.gameMode.description'
    }
  }),
  'image-version': createStringOption({
    description: 'Choose the image version to display stats for.',
    choices: [
      {
        name: 'V1',
        value: 'v1'
      },
      {
        name: 'V2',
        value: 'v2'
      }
    ] as const,
    locales: {
      name: 'commands.player.profile.options.imageVersion.name',
      description: 'commands.player.profile.options.imageVersion.description'
    }
  })
};

@Declare({
  name: 'profile',
  description: 'Get detailed stats like roles, rank, and top heroes for a player.'
})
@LocalesT('commands.player.profile.name', 'commands.player.profile.description')
@Options(options)
export default class ProfileCommand extends SubCommand {
  async run(ctx: CommandContext<typeof options>) {
    await ctx.deferReply();

    const nameOrId = ctx.options['name-or-id'] || (await ctx.client.prisma.user.findFirst({
      where: {
        userID: ctx.author.id
      }
    }))?.rivalsUUID;
    if (!nameOrId) {
      return ctx.editOrReply({
        content: ctx.t.commands.commonErrors.noNameOrId.get()
      });
    }

    const player = await ctx.client.api.getPlayer(nameOrId);

    if (!player) {
      return ctx.editOrReply({
        content: ctx.t.commands.commonErrors.playerNotFound.get()
      });
    }

    const buffer = await (ctx.options['image-version'] === 'v1'
      ? generateProfileV1
      : generateProfileV2)(player, await ctx.client.api.getHeroes(), ctx.options['game-mode']);
    await ctx.editOrReply({
      files: [
        new AttachmentBuilder().setName('profile.png').setFile('buffer', buffer)
      ]
    });
  }
}
