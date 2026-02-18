import {
  type CommandContext,
  createStringOption,
  AttachmentBuilder,
  SubCommand,
  LocalesT,
  Declare,
  Options,
} from "seyfert";

import {
  generateProfileV1,
  generateProfileV2,
} from "../../utils/images/profile";
import { trackerModesMap } from "../../lib/api/trackergg/tracker-api";
import { autocompleteUserCallback } from "../../utils/callbacks";

const options = {
  "name-or-id": createStringOption({
    description: "Enter the player name or ID to identify the player.",
    locales: {
      name: "commands.commonOptions.nameOrId.name",
      description: "commands.commonOptions.nameOrId.description",
    },
    autocomplete: autocompleteUserCallback,
  }),
  "game-mode": createStringOption({
    description: "Choose the game mode to display stats for.",
    required: false,
    choices: [
      {
        name: "Ranked",
        value: "ranked",
      },
      {
        name: "Casual",
        value: "casual",
      },
      {
        name: "Both",
        value: "both",
      },
    ] as const,
    locales: {
      name: "commands.commonOptions.gameMode.name",
      description: "commands.commonOptions.gameMode.description",
    },
  }),
  season: createStringOption({
    description: "Choose the season to display stats for.",
    required: false,
    choices: [
      { name: "All Seasons", value: "all" },
      { name: "Season 6", value: "13" },
      { name: "Season 5.5", value: "12" },
      { name: "Season 5", value: "11" },
      { name: "Season 4.5", value: "10" },
      { name: "Season 4", value: "9" },
      { name: "Season 3.5", value: "8" },
      { name: "Season 3", value: "7" },
      { name: "Season 2.5", value: "6" },
      { name: "Season 2", value: "5" },
      { name: "Season 1.5", value: "4" },
      { name: "Season 1", value: "3" },
      { name: "Season 0.5", value: "2" },
      { name: "Season 0", value: "1" },
    ] as const,
  }),
  "image-version": createStringOption({
    description: "Choose the image version to display stats for.",
    choices: [
      {
        name: "V1",
        value: "v1",
      },
      {
        name: "V2",
        value: "v2",
      },
    ] as const,
    locales: {
      name: "commands.player.profile.options.imageVersion.name",
      description: "commands.player.profile.options.imageVersion.description",
    },
  }),
};

@Declare({
  name: "profile",
  description:
    "Get detailed stats like roles, rank, and top heroes for a player.",
})
@LocalesT("commands.player.profile.name", "commands.player.profile.description")
@Options(options)
export default class ProfileCommand extends SubCommand {
  async run(ctx: CommandContext<typeof options>) {
    await ctx.deferReply();

    const nameOrId =
      ctx.options["name-or-id"] ||
      (
        await ctx.client.prisma.user.findFirst({
          where: {
            userID: ctx.author.id,
          },
        })
      )?.rivalsUUID;
    if (!nameOrId) {
      return ctx.editOrReply({
        content: ctx.t.commands.commonErrors.noNameOrId.get(),
      });
    }

    // todo: la season actual no deberia estar hardcodeada....
    const season = ctx.options.season ?? "13";
    const parsedSeason = season === "all" ? "all" : parseInt(season);

    if (season !== "all") {
      const seasonNumber = parseInt(season);
      if (isNaN(seasonNumber) || seasonNumber < 1 || seasonNumber > 13) {
        return ctx.editOrReply({
          content: ctx.t.commands.commonErrors.invalidSeason.get(),
        });
      }
    }

    const mode = ctx.options["game-mode"] ?? "competitive";

    const [player, heroes] = await Promise.all([
      ctx.client.api.getPlayerCareerData(
        nameOrId,
        trackerModesMap[mode as keyof typeof trackerModesMap],
        parsedSeason,
      ),
      ctx.client.api.getTrackerHeroesMetadata(),
    ]);

    if (!player || !heroes) {
      return ctx.editOrReply({
        content: ctx.t.commands.commonErrors.playerNotFound.get(),
      });
    }

    const buffer = await (
      ctx.options["image-version"] === "v1"
        ? generateProfileV1
        : generateProfileV2
    )(player, heroes, ctx.options["game-mode"]);

    return ctx.editOrReply({
      files: [
        new AttachmentBuilder()
          .setName("profile.png")
          .setFile("buffer", buffer),
      ],
    });
  }
}
