const { SlashCommandBuilder, MessageFlags, ChannelType } = require("discord.js");
const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');
const gTTS = require('gtts');
const fs = require('fs');

const CHARS_LIMIT = 80;

module.exports = {
    data: new SlashCommandBuilder()
        .setName("tts")
        .setDescription("Let the bot join a voice channel and speak the text you provide")
        .addSubcommand(subcommand =>
            subcommand.setName("voicechannel")
                .setDescription("Speak text in a voice channel")
                .addStringOption(option =>
                    option.setName("text")
                        .setDescription("The text you want the bot to speak")
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName("channel")
                        .setDescription("The voice channel you want the bot to join")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildVoice)
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
        )
        .addSubcommand(subcommand =>
            subcommand.setName("dm")
                .setDescription("Send a voice message to a user's DM")
                .addStringOption(option =>
                    option.setName("text")
                        .setDescription("The text you want the bot to speak")
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName("user")
                        .setDescription("The user you want to send the voice message to")
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
        )
        .toJSON(),

    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const { options } = interaction;
        const subcommand = options.getSubcommand();
        const text = options.getString('text');
        const language = options.getString('language') || 'it';

        if (text.length > CHARS_LIMIT) return interaction.editReply({ content: `The prompted text exceed the limit of ${CHARS_LIMIT} chars.`, flags: MessageFlags.Ephemeral });

        const filePath = './tts.mp3';

        if (subcommand === "voicechannel") {
            const voiceChannel = options.getChannel('channel');
            if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) return await interaction.editReply({ content: 'Invalid voice channel', flags: MessageFlags.Ephemeral });

            if (voiceChannel.members.size === 0) return await interaction.editReply({ content: 'This voice channel is empty', flags: MessageFlags.Ephemeral });

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });

                const gtts = new gTTS(text, language);
                gtts.save(filePath, async (err) => {
                    if (err) {
                        console.log(err);
                        return await interaction.editReply({ content: 'Error generating TTS', flags: MessageFlags.Ephemeral });
                    }

                    const resource = createAudioResource(filePath);
                    const player = createAudioPlayer();
                    player.play(resource);
                    connection.subscribe(player);

                    player.on('idle', async () => {
                        connection.destroy();
                        fs.unlinkSync(filePath); // Delete .mp3 after playback
                        await interaction.editReply({ content: `TTS playback finished in ${voiceChannel}`, flags: MessageFlags.Ephemeral });
                    });
                });
            } catch (error) {
                console.error(error);
                return interaction.editReply({ content: 'An error occurred during TTS playback.', flags: MessageFlags.Ephemeral });
            }
        } else if (subcommand === "dm") {
            const user = options.getUser('user');
            const dmChannel = await user.createDM();

            try {
                const gtts = new gTTS(text, language);
                gtts.save(filePath, async (err) => {
                    if (err) {
                        console.log(err);
                        return await interaction.editReply({ content: 'Error generating TTS', flags: MessageFlags.Ephemeral });
                    }

                    await dmChannel.send({ files: [filePath] });
                    fs.unlinkSync(filePath);
                    return await interaction.editReply({ content: `Your message has been sent to ${user}\'s DM`, flags: MessageFlags.Ephemeral });
                });
            } catch (error) {
                console.log(error);
                return await interaction.editReply({ content: `Error sending the message to the ${user}\'s DM`, flags: MessageFlags.Ephemeral });
            }
        }
    }
}