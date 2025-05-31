const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("Show informations about the current playing song.")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    disabled: true,

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

            const song = queue.songs[0];
            embed.setColor("Blue").setDescription(`\`🎵\` **Now playing:** \`${song.name}\` - \`${song.formattedDuration}\`.\nLink:**${song.url}**`).setThumbnail(song.thumbnail).setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });
            return interaction.reply({ embeds: [embed] });

        } catch (err) {
            console.log(err);

            embed.setColor("Red").setDescription("\`❌\` Something went wrong.").setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
}