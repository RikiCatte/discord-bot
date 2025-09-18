const { EmbedBuilder, SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const { useMainPlayer } = require("discord-player");
const msgConfig = require("../../messageConfig.json");
const BotConfig = require("../../schemas/BotConfig");
const { replyNoConfigFound, replyServiceNotEnabled } = require("../../utils/BotConfig");
const { useTimeline } = require('discord-player');
const { SoundCloudExtractor } = require("@discord-player/extractor");
const { YoutubeiExtractor } = require("discord-player-youtubei");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Provide the name or URL for the song. Youtube/Spotify & SoundCloud are supported.')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    autocomplete: async (interaction, done) => {
        const player = useMainPlayer();
        const query = interaction.options.getString('query', true);

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
        const { guild } = interaction;

        const config = await BotConfig.findOne({ GuildID: guild.id });
        const serviceConfig = config.services?.music;
        if (!config) return await replyNoConfigFound(interaction, "music");
        if (!serviceConfig.enabled) return await replyServiceNotEnabled(interaction, "music");

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const voiceChannel = interaction.member.voice.channel;

        const embed = new EmbedBuilder();

        if (!voiceChannel) {

            embed
                .setDescription("`⚠️` You must be in a voice channel to execute music commands.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!interaction.replied && !interaction.deferred) return await interaction.reply({ embeds: [embed] });
            else return await interaction.editReply({ embeds: [embed] });
        }

        if (!interaction.member.voice.channelId == guild.members.me.voice.channelId) {
            embed
                .setDescription(`\`⚠️\` You can't use the music player as it is already active in <#${guild.members.me.voice.channelId}>`)
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!interaction.replied && !interaction.deferred) return await interaction.reply({ embeds: [embed] });
            else return await interaction.editReply({ embeds: [embed] });
        }

        const DJRole = guild.roles.cache.get(serviceConfig.DJRoleID);
        if (DJRole && !interaction.member.roles.cache.has(DJRole.id)) {
            embed
                .setDescription(`\`⚠️\` You need the <@&${DJRole.id}> role to use music commands.`)
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!interaction.replied && !interaction.deferred) return await interaction.reply({ embeds: [embed] });
            else return await interaction.editReply({ embeds: [embed] });
        }

        if (!voiceChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.Connect)) {
            embed
                .setDescription("`⚠️` I don't have permission to connect to your voice channel. Please check my permissions.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!interaction.replied && !interaction.deferred) return await interaction.reply({ embeds: [embed] });
            else return await interaction.editReply({ embeds: [embed] });
        }

        if (!voiceChannel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.Speak)) {
            embed
                .setDescription("`⚠️` I don't have permission to speak in your voice channel. Please check my permissions.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!interaction.replied && !interaction.deferred) return await interaction.reply({ embeds: [embed] });
            else return await interaction.editReply({ embeds: [embed] });
        }

        const player = useMainPlayer();
        const query = interaction.options.getString('query', true);

        let searchOptions = {
            requestedBy: interaction.user,
        };

        if (process.env.ytCookie) searchOptions.searchEngine = `ext:${YoutubeiExtractor.identifier}`; // Use YoutubeiExtractor if cookie is provided, otherwise use default one (it should be SoundCloud)
        if (query.includes("soundcloud.com")) searchOptions.searchEngine = `ext:${SoundCloudExtractor.identifier}`; // Force SoundCloudExtractor if the query contains a SoundCloud link

        const searchResult = await player.search(query, searchOptions);

        if (!searchResult.hasTracks()) {
            embed
                .setDescription(`\`⚠️\` No results were found for query ${query}.`)
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!interaction.replied && !interaction.deferred) return await interaction.reply({ embeds: [embed] });
            else return await interaction.editReply({ embeds: [embed] });
        }

        try {
            const { track } = await player.play(voiceChannel, searchResult, {
                nodeOptions: { metadata: interaction }
            });

            const timeline = useTimeline({ node: interaction.guild });
            const volume = timeline.volume;

            embed
                .setDescription(`\`🎶\` Added **${query}** from \`${track.source}\` to the queue.\nVolume: ${volume}%`)
                .setColor("Greyple");

            try {
                if (!interaction.replied && !interaction.deferred) interaction.reply({ embeds: [embed], fetchReply: true });
                else interaction.editReply({ embeds: [embed], fetchReply: true });
            } catch (err) {
                try {
                    await interaction.followUp({ embeds: [embed], fetchReply: true });
                } catch (err2) {
                    console.error(err2);
                    return await interaction.channel.send(`\`⚠️\` ${interaction.user} There was an error while replying to your interaction please use the commands to handle the music system`);
                }
            }
        } catch (err) {
            console.log(err);

            embed
                .setDescription("`⛔` Something went wrong...")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            try {
                if (!interaction.replied) return await interaction.reply({ embeds: [embed] });
                else return await interaction.editReply({ embeds: [embed] });
            } catch (err) {
                try {
                    await interaction.followUp({ embeds: [embed] });
                } catch (err2) {
                    console.error(err2);
                    return await interaction.channel.send({ embeds: [embed] });
                }
            }
        }
    },
};