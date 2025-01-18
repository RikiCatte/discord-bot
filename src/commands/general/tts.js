const { SlashCommandBuilder, MessageFlags, ChannelType } = require("discord.js");
const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const gTTS = require('gtts');
const fs = require('fs');

const CHARS_LIMIT = 80;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tts")
        .setDescription("Let the bot join a voice channel and speak the text you provide")
        .addStringOption(option =>
            option.setName("text")
                .setDescription("The text you want the bot to speak")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("channel")
                .setDescription("The voice channel ID you want the bot to join")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("language")
                .setDescription("The language you want the bot to speak in (default is it)")
                .addChoices(
                    { name: "Italian", value: "it" },
                    { name: "English", value: "en" },
                )
                .setRequired(false)
        )
        .toJSON(),

    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const { options } = interaction;
        const text = options.getString('text');
        const channel = options.getString('channel');
        const language = options.getString('language') || 'it';

        if (text.length > CHARS_LIMIT) return interaction.editReply({ content: `The prompted text exceed the limit of ${CHARS_LIMIT} chars.`, flags: MessageFlags.Ephemeral });

        const voiceChannel = client.channels.cache.get(channel);
        if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) return interaction.editReply({ content: 'Invalid voice channel' });

        if (voiceChannel.members.size === 0) return interaction.editReply({ content: 'This voice channel is empty' });

        const filePath = './tts.mp3';

        try {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();
            connection.subscribe(player);

            const gtts = new gTTS(text, language);
            gtts.save(filePath, async () => {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });

                const player = createAudioPlayer();
                const resource = createAudioResource(filePath);
                player.play(resource);
                connection.subscribe(player);

                player.on('idle', async () => {
                    fs.unlinkSync(filePath); // Delete .mp3 after playback
                    connection.destroy();
                    await interaction.editReply({ content: `TTS playback finished in ${voiceChannel}`, flags: MessageFlags.Ephemeral });
                });
            });
        } catch (error) {
            console.error(error);
            return interaction.editReply({ content: 'An error occurred during TTS playback.' });
        }
    }
}