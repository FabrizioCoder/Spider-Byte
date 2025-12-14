import type { AutocompleteInteraction } from 'seyfert';

export async function autocompleteUserCallback(interaction: AutocompleteInteraction) {
    const focused = interaction.getInput();
    if (!focused) {
        return interaction.respond([]);
    }
    const result = await interaction.client.api.autocompletePlayerNames(focused);
    if (!result?.data.length) {
        return interaction.respond([]);
    }

    return interaction.respond(
        result.data.slice(0, 25).map((player) => ({
            name: player.platformUserHandle,
            value: player.platformUserHandle
        }))
    );
}
