import { type CommandContext, createStringOption, SubCommand, Formatter, LocalesT, Declare, Options, Embed } from 'seyfert';
import didYouMean, { ReturnTypeEnums } from 'didyoumean2';

import mapsJson from '../../../assets/json/maps.json';

const options = {
    name: createStringOption({
        description: 'The name of the map',
        locales: {
            name: 'commands.game.map.options.name.name',
            description: 'commands.game.map.options.name.description'
        },
        required: true,
        async autocomplete(interaction) {
            const input = interaction.getInput();
            const maps = mapsJson.maps;

            const uniqueMaps = new Map<string, number>();

            if (input.length) {
                const matches = didYouMean(
                    input,
                    maps.map((map) => map.name),
                    {
                        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES,
                        threshold: 0.1
                    }
                ).slice(0, 25);

                for (const mapName of matches) {
                    const matchingMaps = maps.filter((m) => m.full_name === mapName);

                    matchingMaps.forEach((map) => {
                        const displayName = matchingMaps.length > 1
                            ? `${map.full_name} (${map.location})`
                            : map.full_name;

                        uniqueMaps.set(displayName, map.id);
                    });
                }
            } else {
                maps.toSorted((a, b) => a.name.localeCompare(b.name))
                    .slice(0, 25)
                    .forEach((map) => {
                        const sameNameMaps = maps.filter((m) => m.name === map.name);
                        const displayName = sameNameMaps.length > 1
                            ? `${map.full_name} (${map.location})`
                            : map.full_name;

                        uniqueMaps.set(displayName, map.id);
                    });
            }
            const result = Array.from(uniqueMaps.entries()).map(([name, id]) => ({
                name,
                value: String(id)
            }));

            return interaction.respond(result.length
                ? result
                : maps.slice(0, 25).map((map) => ({
                    name: map.full_name,
                    value: map.id.toString()
                })));
        }
    })
};

@Declare({
    name: 'map',
    description: 'Get the information of a map'
})
@LocalesT('commands.game.map.name', 'commands.game.map.description')
@Options(options)
export default class MapCommand extends SubCommand {
    async run(ctx: CommandContext<typeof options>) {
        await ctx.deferReply();

        const mapId = parseInt(ctx.options.name);

        const map = mapsJson.maps.find((m) => m.id === mapId) ?? null;

        if (!map) {
            return ctx.editOrReply({
                content: ctx.t.commands.game.map.notFound.get()
            });
        }

        const mapEmbed = new Embed()
            .setTitle(map.full_name)
            .setDescription(map.description)
            .setColor('Blurple')
            .setImage(ctx.client.api.buildImage(map.images[2].replace('/rivals', '')))
            .addFields([
                {
                    name: Formatter.underline('Game Mode'),
                    value: map.game_mode,
                    inline: true
                },
                // {
                //     name: Formatter.underline('Competitiveness'),
                //     value: map.is_competitve
                //         ? 'Competitive'
                //         : 'Casual',
                //     inline: true
                // },
                {
                    name: Formatter.underline('Location'),
                    value: map.location,
                    inline: true
                }
            ]);
        if (map.video) {
            mapEmbed.setURL(map.video);
        }

        if (map.sub_map_id !== null) {
            mapEmbed.addFields({
                name: Formatter.underline('Sub Map'),
                value: `* ${map.sub_map_id} - ${map.sub_map_name ?? 'N/A'}`,
                inline: true
            });
        }

        return ctx.editOrReply({ embeds: [mapEmbed] });
    }
}
