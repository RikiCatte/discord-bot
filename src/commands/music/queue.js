const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("queue")
        .setDescription("Get the list of your currently active queue.")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const { member, guild } = interaction;

        const voiceChannel = member.voice.channel;

        const embed = new EmbedBuilder();

        if (!voiceChannel) {
            embed.setColor("Red").setDescription("You must be in a voice channel  to execute music commands.").setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        if (!member.voice.channelId == guild.members.me.voice.channelId) {
            embed.setColor("Red").setDescription(`You can't use the music player because it's already active in <#${guild.members.me.voice.channelId}>`).setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        try {

            const queue = await client.distube.getQueue(voiceChannel)

            if (!queue) {
                embed.setColor("Red").setDescription("\`❌\` There is no active queue.").setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            embed.setColor("Purple").setDescription(`${queue.song.map(
                (song, id) => `\n**${id + 1}.** ${song.name} -\`${song.formattedDuration}\``
            )}`)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed] });
        } catch (err) {
            console.log(err);

            embed.setColor("Red").setDescription("\`❌\` Something went wrong.").setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
}