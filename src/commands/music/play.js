const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, SlashCommandBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const client = require('../../index');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Provide the name or URL for the song.')
                .setRequired(true)
        ),
    userPermissions: [],
    botPermissions: [],
    disabled: true,

    run: async (client, interaction) => {
        const { options, member, guild, channel } = interaction;

        const query = options.getString('query');
        const voiceChannel = member.voice.channel;

        const embed = new EmbedBuilder();

        if (!voiceChannel) {
            embed.setColor('#ff0000').setDescription('You must be in a voice channel to execute music commands.');
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (!member.voice.channelId == guild.members.me.voice.channelId) {
            embed.setColor('#ff0000').setDescription(`You can't use the music player as it is already active in <#${guild.members.me.voice.channelId}>`);
            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        try {
            await client.distube.play(voiceChannel, query, { textChannel: channel, member: member });

            const pauseButton = new ButtonBuilder()
                .setCustomId('pause')
                .setLabel('Pause')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("⏸");

            const resumeButton = new ButtonBuilder()
                .setCustomId('resume')
                .setLabel('Resume')
                .setStyle(ButtonStyle.Success)
                .setEmoji("▶️");

            const skipButton = new ButtonBuilder()
                .setCustomId('skip')
                .setLabel('Skip')
                .setStyle(ButtonStyle.Danger)
                .setEmoji("⏭");

            const stopButton = new ButtonBuilder()
                .setCustomId('stop')
                .setLabel('Stop')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji("⏹");

            const loopButton = new ButtonBuilder()
                .setCustomId('loop')
                .setLabel('Loop')
                .setStyle(ButtonStyle.Success)
                .setEmoji("🔁");

            const leaveButton = new ButtonBuilder()
                .setCustomId('leave')
                .setLabel("Leave VC")
                .setStyle(ButtonStyle.Danger)
                .setEmoji("💨")

            const row1 = new ActionRowBuilder()
                .addComponents(pauseButton, resumeButton, skipButton);

            const row2 = new ActionRowBuilder()
                .addComponents(stopButton, loopButton, leaveButton);

            const collectorTime = 1500000;
            const expTime = Math.floor((new Date().getTime() + collectorTime) / 1000);

            embed
                .setColor('#00ff00')
                .setDescription(`You can control the music with buttons. Or you can use commands to skip, loop, shuffle songs, etc. Use \`/bug-report\` if you encounter any bugs or issues. These buttons will expire in <t:${expTime}:R>`);

            let message;
            try {
                if (interaction)
                    message = await interaction.reply({ embeds: [embed], components: [row1, row2] });
            } catch (e) {
                // console.log(e);
                return await interaction.channel.send(`${interaction.user} There was an error while replying to your interaction please use the commands to handle the music system`);
            }

            // Add a listener for button interactions
            const filter = (i) => ['pause', 'skip', 'resume', 'stop', 'loop', 'leave'].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = await message.createMessageComponentCollector({ filter, time: collectorTime });

            collector.on('collect', async (i) => {
                try {
                    if (i.customId === 'pause') {
                        client.distube.pause(guild);
                        embed.setDescription('⏸ Music paused.');
                        await i.update({ embeds: [embed] });
                    } else if (i.customId === 'skip') {
                        client.distube.skip(guild);
                        embed.setDescription('⏭️ Song skipped.');
                        await i.update({ embeds: [embed] });
                    } else if (i.customId === 'resume') {
                        client.distube.resume(guild);
                        embed.setDescription('▶️ Music resumed.');
                        await i.update({ embeds: [embed] });
                    } else if (i.customId === 'stop') {
                        client.distube.stop(guild);
                        embed.setDescription('⏹️ Music stopped.');
                        await i.update({ embeds: [embed] });
                    } else if (i.customId === 'loop') {
                        const toggle = client.distube.toggleAutoplay(guild);
                        embed.setDescription(`🔁 Loop ${toggle ? 'enabled' : 'disabled'}.`);
                        await i.update({ embeds: [embed] });
                    }
                    else if (i.customId === 'leave') {
                        await client.distube.voices.leave(voiceChannel.guild.id);
                        embed.setDescription('💨 Bot has left the vocal channel.');
                        await i.update({ embeds: [embed] });
                    }
                } catch (error) {
                    embed.setDescription(`❌ ${error.message}`);
                    await i.update({ embeds: [embed] });
                }
            });

            collector.on('end', async () => {
                // Remove the buttons after the collector expires
                try {
                    await message.edit({ components: [] });
                } catch (e) {
                    return;
                }
            });
        } catch (err) {
            console.log(err);

            embed.setColor('#ff0000').setDescription('⛔ | Something went wrong...');

            return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    },
};