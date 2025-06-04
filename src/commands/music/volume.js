const { EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("volume")
        .setDescription("Adjust song's volume.")
        .addIntegerOption(option =>
            option.setName("volume")
                .setDescription("50 = 50%")
                .setMinValue(0)
                .setMaxValue(100)
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    disabled: true,

    run: async (client, interaction) => {
        const { member, guild, options } = interaction;

        const volume = options.getInteger("volume");
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

            client.distube.setVolume(voiceChannel, volume);
            return interaction.reply({ content: `\`🔈\` Volume has been set to ${volume}%` });

        } catch (err) {
            console.log(err);

            embed.setColor("Red").setDescription("\`❌\` Something went wrong.").setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    }
}