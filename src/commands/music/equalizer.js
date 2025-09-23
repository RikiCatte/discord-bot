const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require("discord.js");
const msgConfig = require("../../messageConfig.json");
const BotConfig = require("../../schemas/BotConfig");
const { replyNoConfigFound, replyServiceNotEnabled } = require("../../utils/BotConfig");
const { useQueue } = require("discord-player");
const { EqualizerConfigurationPreset } = require("discord-player");
const titleCase = require("../../utils/titleCase");
const buildTrackInfo = require("../../utils/music/buildTrackInfo");
const MusicEmbed = require("../../utils/music/musicEmbed");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("equalizer")
        .setDescription("Manage equalizer filters for the current queue.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Set an equalizer preset for the current queue.")
                .addStringOption(option =>
                    option
                        .setName("preset")
                        .setDescription("Choose an equalizer preset.")
                        .addChoices(Object.keys(EqualizerConfigurationPreset).map((preset) => ({
                            name: preset,
                            value: preset
                        })))
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("reset")
                .setDescription("Disable the equalizer filter.")
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
                .setDescription("\`❌\` This server does not have an active player session.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        if (!queue.filters.equalizer) {
            embed
                .setDescription("`❌` Equalizer filter is not available for this queue.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            const embedHandler = new MusicEmbed(client);
            switch (subcommand) {
                case "set": {
                    const preset = interaction.options.getString("preset");

                    if (queue.filters.equalizer.preset === preset) {
                        embed
                            .setDescription(`\`⚠️\` The equalizer is already set to the **${titleCase(preset)}** preset.`)
                            .setColor("Orange")
                            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                        return await interaction.editReply({ embeds: [embed] });
                    }

                    queue.filters.equalizer.setEQ(EqualizerConfigurationPreset[preset]);
                    queue.equalizerPreset = preset;

                    const trackInfo = buildTrackInfo(queue);
                    await embedHandler.updateMusicEmbed(interaction.guild.id, trackInfo);

                    embed
                        .setDescription(`\`✅\` Equalizer preset set to **${titleCase(preset)}**.`)
                        .setColor("Green")
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    return await interaction.editReply({ embeds: [embed] });
                }
                case "reset": {
                    if (!queue.filters.equalizer.disabled) {
                        embed
                            .setDescription("`⚠️` There is no equalizer filter applied to the queue.")
                            .setColor("Orange")
                            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                        return await interaction.editReply({ embeds: [embed] });
                    }

                    queue.filters.equalizer.disable();
                    queue.equalizerPreset = "Off";

                    const trackInfo = buildTrackInfo(queue);
                    await embedHandler.updateMusicEmbed(interaction.guild.id, trackInfo);

                    embed
                        .setDescription("`✅` Equalizer filter reset.")
                        .setColor("Green")
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    return await interaction.editReply({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error("Error handling equalizer command:", error);

            embed
                .setDescription("`❌` An error occurred while processing your request. Please try again later or contact DEVs.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }
    }
}