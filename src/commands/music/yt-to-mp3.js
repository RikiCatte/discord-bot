const { SlashCommandBuilder, MessageFlags, EmbedBuilder } = require('discord.js');
const BotConfig = require("../../schemas/BotConfig");
const msgConfig = require("../../messageConfig.json");
const { downloadTrackToMp3 } = require("../../utils/music/downloadTrack");
const { getInnertube } = require("../../utils/music/innertube");
const { getMaxUploadSize } = require("../../utils/utils.js");
const { replyNoConfigFound, replyServiceNotEnabled } = require("../../utils/BotConfig");
const { useMainPlayer } = require("discord-player");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yt-to-mp3')
        .setDescription('Download a YT video as an MP3 file (READ DISCLAIMER!).')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('YT video URL / song name to download.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    autocomplete: async (interaction, done) => {
        const player = useMainPlayer();
        const query = interaction.options.getString('url', true);

        if (!query || query.trim().length < 2) {
            if (done) done(true);
            return interaction.respond([]);
        }

        try {
            const results = await player.search(query);
            if (done) done(true);
            return interaction.respond(
                results.tracks.slice(0, 10).map((t) => ({
                    name: t.title,
                    value: t.url,
                })),
            );
        } catch (err) {
            if (done) done(true);
            return interaction.respond([]).catch(() => { });
        }
    },

    run: async (client, interaction) => {
        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.music;

        if (!config) return await replyNoConfigFound(interaction, "music");
        if (!serviceConfig?.enabled) return await replyServiceNotEnabled(interaction, "music");

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const embed = new EmbedBuilder();

        const DJRole = interaction.guild.roles.cache.get(serviceConfig.DJRoleID);
        if (DJRole && !interaction.member.roles.cache.has(DJRole.id)) {
            embed
                .setDescription(`\`⚠️\` You need the <@&${DJRole.id}> role to use music commands.`)
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        try {
            const player = useMainPlayer();
            const query = interaction.options.getString('url', true);

            let searchOptions = { requestedBy: interaction.user };
            const searchResult = await player.search(query, searchOptions);

            if (!searchResult.hasTracks()) {
                embed
                    .setDescription(`\`⚠️\` No results were found for query: **${query}**.`)
                    .setColor("Red")
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                return await interaction.editReply({ embeds: [embed] });
            }

            const track = searchResult.tracks[0];

            const fakeTrack = {
                title: track.title,
                url: track.url,
                id: track.id,
            };

            const outputPath = await downloadTrackToMp3({ track: fakeTrack, getInnertube });

            const stats = fs.statSync(outputPath);
            const maxSize = getMaxUploadSize(interaction.guild);

            if (stats.size > maxSize) {
                embed
                    .setDescription(`\`⚠️\` The downloaded file exceeds Discord's upload limit for this guild (${(maxSize / 1024 / 1024).toFixed(2)}MB).`)
                    .setColor("Red")
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                await interaction.editReply({ embeds: [embed] });
            } else {
                embed
                    .setDescription(`\`💾\` **Disclaimer**: This feature is for personal/educational use only. Developers will not assume any responsibility for the content downloaded`)
                    .setColor("Green")
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                await interaction.editReply({ embeds: [embed], files: [outputPath] });
            }

            fs.unlinkSync(outputPath);
        } catch (err) {
            console.error('[YT-TO-MP3] error: ', err);

            embed
                .setDescription("`⚠️` An error occurred while processing your request. Please try again later.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }
    }
}