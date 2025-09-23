const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require("discord.js");
const msgConfig = require("../../messageConfig.json");
const BotConfig = require("../../schemas/BotConfig");
const { replyNoConfigFound, replyServiceNotEnabled } = require("../../utils/BotConfig");
const { useQueue } = require("discord-player");
const ffmpegFilters = require("../../utils/music/ffmpegFilters");
const titleCase = require("../../utils/titleCase");
const buildTrackInfo = require("../../utils/music/buildTrackInfo");
const MusicEmbed = require("../../utils/music/musicEmbed");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("filter")
        .setDescription("Toggle FFMPEG audio filters to the current queue.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("toggle")
                .setDescription("Toggle an audio filter on or off.")
                .addStringOption(option =>
                    option
                        .setName("filter")
                        .setDescription("The audio filter to toggle.")
                        .addChoices(
                            ffmpegFilters.map((filter) => ({
                                name: filter,
                                value: filter.toLowerCase()
                            }))
                        )
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("reset")
                .setDescription("Remove all audio filters from the queue.")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("List all active audio filters on the queue.")
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

        const subcommand = interaction.options.getSubcommand();
        const enabledFilters = queue.filters.ffmpeg.getFiltersEnabled();
        const disabledFilters = queue.filters.ffmpeg.getFiltersDisabled();

        try {
            const embedHandler = new MusicEmbed(client);
            switch (subcommand) {
                case "toggle": {
                    if (!queue.filters.ffmpeg) {
                        embed
                            .setDescription("`❌` FFMPEG filters are not available on this queue.")
                            .setColor("Red")
                            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                        return await interaction.editReply({ embeds: [embed] });
                    }

                    const filterName = interaction.options.getString("filter");
                    const currentTrackTitle = queue.currentTrack?.title || null;

                    const toggle = await queue.filters.ffmpeg.toggle(filterName);

                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second to ensure the filter is applied

                    const afterTrackTitle = queue.currentTrack?.title || null;

                    if (
                        !queue.node.isPlaying() ||
                        !afterTrackTitle ||
                        (currentTrackTitle && afterTrackTitle && currentTrackTitle !== afterTrackTitle)
                    ) {
                        embed
                            .setDescription(`\`❌\` The filter **${filterName}** caused an error and playback was stopped. Please try another filter and contact DEVs.`)
                            .setColor("Red");

                        return await interaction.editReply({ embeds: [embed] });
                    }

                    const trackInfo = buildTrackInfo(queue);
                    await embedHandler.updateMusicEmbed(interaction.guild.id, trackInfo);

                    embed
                        .setDescription(`\`✅\` The **${filterName}** filter has been ${toggle ? "enabled" : "disabled"}.`)
                        .setColor("Green")
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    return await interaction.editReply({ embeds: [embed] });
                }
                case "reset": {
                    if (!enabledFilters.length) {
                        embed
                            .setDescription("`⚠️` There are no active filters to reset.")
                            .setColor("Orange")
                            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                        return await interaction.editReply({ embeds: [embed] });
                    }

                    queue.filters.ffmpeg.setFilters(false);

                    const trackInfo = buildTrackInfo(queue);
                    await embedHandler.updateMusicEmbed(interaction.guild.id, trackInfo);

                    embed
                        .setDescription("`✅` All audio filters have been removed from the queue.")
                        .setColor("Green")
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    return await interaction.editReply({ embeds: [embed] });
                }
                case "list": {
                    const formatFilters = (filters, status) =>
                        filters
                            .map((filter) => `${titleCase(filter)} --> ${status}`)
                            .join("\n");

                    const enabledFiltersDescription = formatFilters(enabledFilters, "✅");
                    const disabledFiltersDescription = formatFilters(disabledFilters, "❌");

                    embed
                        .setTitle("`🔧` Active FFMPEG Audio Filters")
                        .setDescription(`${enabledFiltersDescription}\n\n${disabledFiltersDescription}`)
                        .setColor("Blue")
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    return await interaction.editReply({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error("Error handling filter command:", error);
            embed
                .setDescription("`❌` An error occurred while processing your request.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }
    }
}