const { EmbedBuilder, SlashCommandBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const msgConfig = require("../../messageConfig.json");
const BotConfig = require("../../schemas/BotConfig");
const { replyNoConfigFound, replyServiceNotEnabled } = require("../../utils/BotConfig");
const { useMainPlayer } = require('discord-player');
const playSong = require("../../utils/music/playSong");

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

        if (
            guild.members.me.voice.channelId &&
            voiceChannel.id !== guild.members.me.voice.channelId
        ) {
            embed
                .setDescription(`\`⚠️\` You can't use the music player as it is already active in <#${guild.members.me.voice.channelId}>`)
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        const DJRole = guild.roles.cache.get(serviceConfig.DJRoleID);
        if (DJRole && !interaction.member.roles.cache.has(DJRole.id)) {
            embed
                .setDescription(`\`⚠️\` You need the <@&${DJRole.id}> role to use music commands.`)
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        if (!voiceChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.Connect)) {
            embed
                .setDescription("`⚠️` I don't have permission to connect to your voice channel. Please check my permissions.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        if (!voiceChannel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.Speak)) {
            embed
                .setDescription("`⚠️` I don't have permission to speak in your voice channel. Please check my permissions.")
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        }

        const query = interaction.options.getString('query', true);

        const success = await playSong({
            client,
            guild,
            user: interaction.user,
            voiceChannel,
            query,
            channel: interaction.channel
        });

        if (!success) {
            embed
                .setDescription(`\`⚠️\` No results were found for query: **${query}**.`)
                .setColor("Red")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return await interaction.editReply({ embeds: [embed] });
        } else {
            embed
                .setDescription(`\`🎶\` Added **${query}** to the queue.`)
                .setColor("Greyple");

            return await interaction.editReply({ embeds: [embed] });
        }
    },
};