import type { SelectMenuInteraction, ButtonInteraction } from 'seyfert';
import type { ColorResolvable, MakeRequired } from 'seyfert/lib/common';

import {
    createStringOption,
    StringSelectOption,
    StringSelectMenu,
    SubCommand,
    ActionRow,
    Formatter,
    LocalesT,
    Declare,
    Options,
    Embed
} from 'seyfert';
import { type CommandContext, type OKFunction, Button } from 'seyfert';
import didYouMean, { ReturnTypeEnums } from 'didyoumean2';
import { MessageFlags, ButtonStyle } from 'seyfert';

import type {
    HeroesDTO,
    Ability
} from '../../types/dtos/HeroesDTO';

import { parseNameForRivalSkins } from '../../utils/functions/skins';
import { capitalize } from '../../utils/functions/capitalize';
import { getHeroHistoryLink } from '../../utils/images/_';
import { STICKY_CDN_DOMAIN } from '../../utils/env';
import { Role } from '../../types/dtos/HeroesDTO';

const colorPerRole = {
    [Role.Duelist]: '#FF4500',
    [Role.Strategist]: '#1E90FF',
    [Role.Vanguard]: '#8B0000'
};

const options = {
    name: createStringOption({
        description: 'The hero you want to get information about',
        async autocomplete(interaction) {
            const input = interaction.getInput();
            const heroes = await interaction.client.api.getHeroes();
            const result = (input.length
                ? didYouMean(
                    interaction.getInput(),
                    heroes.map((hero) => hero.name),
                    {
                        returnType: ReturnTypeEnums.ALL_SORTED_MATCHES,
                        threshold: 0.1
                    }
                ).slice(0, 25)
                : heroes.toSorted((a, b) => {
                    if (a.name < b.name) {
                        return -1;
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    return 0;
                }).slice(0, 25).map((
                    hero
                ) => hero.name)).map((heroName) => ({
                    name: heroName,
                    value: heroName
                }));

            if (result.length) {
                return interaction.respond(
                    result
                );
            }

            return interaction.respond(heroes.slice(0, 25).map((hero) => ({
                name: hero.name,
                value: hero.name
            })));

        },
        async value({ value, context: ctx }, ok: OKFunction<HeroesDTO>, fail) {
            const hero = (await ctx.client.api.getHeroes()).find(
                (h) => h.name === value || h.id === value
            );
            if (!hero) {
                fail(ctx.t.commands.hero.about.notFound(Formatter.inlineCode(value)).get());
                return;
            }

            ok(hero);
        },
        required: true,
        locales: {
            name: 'commands.hero.about.options.name.name',
            description: 'commands.hero.about.options.name.description'
        }
    })
};

@Declare({
    name: 'about',
    description: 'Get detailed info about a hero, including abilities and stats.'
})
@LocalesT('commands.hero.about.name', 'commands.hero.about.description')
@Options(options)
export default class AboutCommand extends SubCommand {
    static generateRows(clicked: 'hero' | 'lore') {
        const row = new ActionRow<StringSelectMenu | Button>();

        const heroButton = new Button()
            .setLabel('Hero')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('hero')
            .setDisabled(clicked === 'hero');

        const loreButton = new Button()
            .setLabel('Lore')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('lore')
            .setDisabled(clicked === 'lore');

        const abilitiesButton = new Button()
            .setLabel('Abilities')
            .setStyle(ButtonStyle.Primary)
            .setCustomId('abilities');

        return row.addComponents(heroButton, loreButton, abilitiesButton);
    }

    static generateActionRowSelectMenu(
        abilities: Ability[],
        selectedAbility?: Omit<Ability, 'name' | 'type'>
    ): ActionRow<StringSelectMenu | Button>[] {
        const selectMenuRow = new ActionRow<StringSelectMenu>();
        const buttonRow = new ActionRow<Button>();

        const selectMenu = new StringSelectMenu()
            .setCustomId('abilitiesMenu')
            .setPlaceholder('Select an ability')
            .setOptions(
                abilities.filter((
                    ability
                ): ability is MakeRequired<Ability, 'name'> => !ability.isCollab).map((ability) => {
                    const option = new StringSelectOption()
                        .setLabel(ability.name || 'Passive')
                        .setValue(String(ability.id));
                    return option;
                })
            );

        const buttons = [
            new Button()
                .setLabel('Back')
                .setStyle(ButtonStyle.Primary)
                .setCustomId('back'),
            new Button()
                .setLabel('Show combo')
                .setStyle(ButtonStyle.Primary)
                .setCustomId('combo')
        ];

        if (selectedAbility && !selectedAbility.isCollab) {
            buttons.push(
                new Button()
                    .setLabel('Show video')
                    .setStyle(ButtonStyle.Primary)
                    .setCustomId(`video_${selectedAbility.id}`)
            );
        }

        return [
            selectMenuRow.addComponents(selectMenu),
            buttonRow.addComponents(buttons)
        ];
    }

    override async run(ctx: CommandContext<typeof options>) {
        const hero = ctx.options.name;
        const heroMoreInfo = await ctx.client.api.getHero(hero.id);

        if (!heroMoreInfo) {
            return ctx.editOrReply({
                content: ctx.t.commands.hero.about.notFound(Formatter.inlineCode(hero.name)).get()
            });
        }

        const baseEmbed = new Embed().setColor(
            colorPerRole[capitalize(hero.role) as Role] as ColorResolvable
        );
        const heroNameParsed = parseNameForRivalSkins(hero.name);
        baseEmbed.setThumbnail(`${STICKY_CDN_DOMAIN}/Content/Marvel_LQ/UI/Textures/HeroPortrait/SelectHero/img_selecthero_${hero.id}001.png`);
        baseEmbed.setAuthor({
            name: `${hero.real_name} (${heroNameParsed})`,
            iconUrl:
                `${STICKY_CDN_DOMAIN}/Content/Marvel_LQ/UI/Textures/Item/Kill/item_kill_2${hero.id}13.png`
        });

        baseEmbed.setDescription(hero.bio)
            .setImage(
                getHeroHistoryLink(hero.id)
            );
        baseEmbed.setFooter({
            text: capitalize(hero.role)
        });

        const heroEmbed = new Embed(baseEmbed.toJSON());
        const loreEmbed = new Embed(baseEmbed.toJSON());
        loreEmbed.setDescription(hero.lore);

        const message = await ctx.editOrReply(
            {
                embeds: [heroEmbed],
                components: [AboutCommand.generateRows('hero')]
            },
            true
        );

        const collector = message.createComponentCollector({
            idle: 60 * 60 * 1e3,
            filter(interaction) {
                return interaction.user.id === ctx.author.id;
            }
        });

        collector.run<ButtonInteraction>(
            'hero',
            (interaction) => interaction.update({
                embeds: [heroEmbed],
                components: [AboutCommand.generateRows('hero')]
            })
        );

        collector.run<ButtonInteraction>(
            'lore',
            (interaction) => interaction.update({
                embeds: [loreEmbed],
                components: [AboutCommand.generateRows('lore')]
            })
        );

        collector.run<ButtonInteraction>(
            'back',
            (interaction) => interaction.update({
                embeds: [heroEmbed],
                components: [AboutCommand.generateRows('hero')]
            })
        );

        collector.run<ButtonInteraction>(
            'combo',
            async (interaction) => {
                await interaction.deferReply(MessageFlags.Ephemeral);
                await interaction.editOrReply({
                    content: `${STICKY_CDN_DOMAIN}/Content/Marvel/Movies_HeroSkill/Windows/En-US/${hero.id}/${hero.id}0010/${hero.id}_Combo_High.mp4`,
                    flags: MessageFlags.Ephemeral
                });
            }
        );

        collector.run<ButtonInteraction>('abilities', async (interaction) => {
            const embed = interaction.message.embeds.at(0);
            if (!embed) {
                return;
            }
            await interaction.update({
                embeds: [embed],
                components: AboutCommand.generateActionRowSelectMenu(hero.abilities)
            });
        });

        collector.run<ButtonInteraction>(/video_[0-9]{1,}/, async (interaction) => {
            const abilityID = interaction.customId.slice(6);
            await interaction.deferReply(MessageFlags.Ephemeral);
            await interaction.editOrReply({
                content: `${STICKY_CDN_DOMAIN}/Content/Marvel/Movies_HeroSkill/Windows/En-US/${hero.id}/${hero.id}0010/${abilityID}_High.mp4`,
                flags: MessageFlags.Ephemeral
            });
        });

        collector.run<SelectMenuInteraction>(/./, async (interaction) => {
            const abilityId = interaction.values.at(0);
            if (!abilityId) {
                return;
            }

            const abilityData = heroMoreInfo.abilities.find((a) => a.id === Number(abilityId));
            const abilityData2 = hero.abilities.find((a) => a.id === Number(abilityId));
            if (!abilityData || !abilityData2) {
                return;
            }

            const abilityEmbed = new Embed(baseEmbed.toJSON());
            const description: string[] = [];
            if (abilityData.description) {
                description.push(
                    abilityData.description.replaceAll(
                        /(<[a-z]{1,}>)|(<\/>)/gmi,
                        ''
                    )
                );
            }

            for (const field in abilityData.additional_fields) {
                const fieldContent = abilityData
                    .additional_fields[field];
                if (!fieldContent) {
                    continue;
                }
                description.push(`**${field}**: ${fieldContent}`);
            }

            abilityEmbed
                .setTitle(`${abilityData.name || abilityData2.name || 'Passive'} (${abilityData.type})`);
            abilityEmbed.setThumbnail(
                `${STICKY_CDN_DOMAIN}/Content/Marvel_LQ/UI/Textures/Ability/${hero.id}/icon_${abilityData.id}.png`
            );
            abilityEmbed.setDescription(description.join('\n'));
            await interaction.update({
                embeds: [abilityEmbed],
                components: AboutCommand.generateActionRowSelectMenu(
                    hero.abilities,
                    abilityData
                )
            });
        });
    }

    override onBeforeOptions(ctx: CommandContext) {
        return ctx.deferReply();
    }
}
