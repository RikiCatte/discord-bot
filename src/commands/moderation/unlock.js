const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlocks a given channel')
        .addChannelOption(option => option.setName('channel').setDescription('The channel you want to unlock').addChannelTypes(ChannelType.GuildText).setRequired(false))
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

    run: async (client, interaction) => {
        const { member, channel: interactionChannel } = interaction;
        let selectedChannel = interaction.options.getChannel('channel');

        if (!selectedChannel) {
            selectedChannel = interactionChannel;
        }

        selectedChannel.permissionOverwrites.delete(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setDescription(`\`✅\` ${selectedChannel} has been **unlocked** by ${member.user}`)
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(member.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        await interaction.reply({ embeds: [embed] });
    }
}