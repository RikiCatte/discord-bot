const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require("discord.js");
const msgConfig = require("../../messageConfig.json");
const BotConfig = require("../../schemas/BotConfig");
const { replyNoConfigFound, replyServiceNotEnabled } = require("../../utils/BotConfig");
const { useQueue } = require("discord-player");
const { BiquadFilterType } = require("discord-player");
const { titleCase } = require("../../utils/utils.js");
const buildTrackInfo = require("../../utils/music/buildTrackInfo");
const MusicEmbed = require("../../utils/music/musicEmbed");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("biquad")
        .setDescription("Manage biquad filters for the current queue.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Set a biquad filter with specific parameters.")
                .addStringOption(option =>
                    option
                        .setName("preset")
                        .setDescription("Choose a preset for the biquad filter.")
                        .addChoices(Object.keys(BiquadFilterType).map((filter) => ({
                            name: filter,
                            value: filter
                        })))
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("reset")
                .setDescription("Disable the biquad filter.")
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.music;
        if (!config) return await replyNoConfigFound(interaction, "music");
        if (!serviceConfig?.enabled) return await replyServiceNotEnabled(interaction, "music");

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const voiceChannel = interaction.member.voice.channel;
        const embed = new EmbedBuilder();

        if (!voiceChannel) {
            embed
                .setDescription("`⚠️` You must be in a voice channel to execute music commands.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        if (!interaction.member.voice.channelId == interaction.guild.members.me.voice.channelId) {
            embed
                .setDescription(`\`⚠️\` You can't use the music player because it's already active in <#${interaction.guild.members.me.voice.channelId}>`)
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        const DJRole = interaction.guild.roles.cache.get(serviceConfig.DJRoleID);
        if (DJRole && !interaction.member.roles.cache.has(DJRole.id)) {
            embed
                .setDescription(`\`⚠️\` You need the <@&${DJRole.id}> role to use music commands.`)
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        const queue = useQueue(interaction.guild);

        if (!queue) {
            embed
                .setDescription("`❌` This server does not have an active player session.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        if (!queue.filters.biquad) {
            embed
                .setDescription("`⚠️` There is no biquad filter applied to the queue.")
                .setColor("Orange")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            const embedHandler = new MusicEmbed(client);
            switch (subcommand) {
                case "set": {
                    const preset = interaction.options.getString("preset");
                    queue.filters.biquad.setFilter(BiquadFilterType[preset]);
                    queue.biquadPreset = preset;

                    const trackInfo = buildTrackInfo(queue);
                    await embedHandler.updateMusicEmbed(interaction.guild.id, trackInfo);

                    embed
                        .setDescription(`\`✅\` Biquad filter set to **${titleCase(preset)}**.`)
                        .setColor("Green")
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    return await interaction.editReply({ embeds: [embed] });
                }
                case "reset": {
                    if (queue.filters.biquad.disabled) {
                        embed
                            .setDescription("`⚠️` There is no biquad filter applied to the queue.")
                            .setColor("Orange")
                            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                        return await interaction.editReply({ embeds: [embed] });
                    }

                    queue.filters.biquad.disable();
                    queue.biquadPreset = "off";

                    const trackInfo = buildTrackInfo(queue);
                    await embedHandler.updateMusicEmbed(interaction.guild.id, trackInfo);

                    embed
                        .setDescription("`✅` Biquad filter reset.")
                        .setColor("Green")
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    return await interaction.editReply({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error("Error managing biquad filter:", error);

            embed
                .setDescription("`❌` An error occurred while managing the biquad filter. Please try again later or contact DEVs.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }
    }
}