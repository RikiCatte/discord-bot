const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rewind")
        .setDescription("Rewind seconds in a song.")
        .addIntegerOption(option =>
            option.setName("seconds")
                .setDescription("Amount of seconds to rewind. (50 = 50s)")
                .setMinValue(0)
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const { options, member, guild } = interaction;

        const seconds = options.getInteger("seconds");

        const voiceChannel = member.voice.channel;

        const embed = new EmbedBuilder();

        if (!voiceChannel) {
            embed.setColor("Red").setDescription("You must be in a voice channel  to execute music commands.").setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (!member.voice.channelId == guild.members.me.voice.channelId) {
            embed.setColor("Red").setDescription(`You can't use the music player because it's already active in <#${guild.members.me.voice.channelId}>`).setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {

            const queue = await client.distube.getQueue(voiceChannel)

            if (!queue) {
                embed.setColor("Red").setDescription("\`❌\` There is no active queue.").setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            }

            await queue.seek(queue.currentTime - seconds);
            embed.setColor("Blue").setDescription(`\`⏪\` Rewinded the song for \`${seconds}s\`.`).setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed] });

        } catch (err) {
            console.log(err);

            embed.setColor("Red").setDescription("\`❌\` Something went wrong.").setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
}