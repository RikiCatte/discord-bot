const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Set the slowmode of a channel')
        .addIntegerOption(option => option.setName('duration').setDescription('The slowmode\'s time').setRequired(true))
        .addChannelOption(option => option.setName('channel').setDescription('The channel you want to set the slowmode of').addChannelTypes(ChannelType.GuildText).setRequired(false))
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

    run: async (client, interaction) => {

        const { options } = interaction;
        const duration = options.getInteger('duration');
        const channel = options.getChannel('channel') || interaction.channel;

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setDescription(`:white_check_mark: ${channel} now has ${duration} seconds of **slowmode**`)
            .setAuthor({ name: 'The Economic Heaven', iconURL: 'https://i.imgur.com/LH8RvIg.gif' })
            .setThumbnail('https://i.imgur.com/LH8RvIg.gif')
            .setTimestamp()
            .setFooter({ text: `|   Developed by RikiCatte`, iconURL: 'https://i.imgur.com/orIPOGE.png' });

        channel.setRateLimitPerUser(duration).catch(err => {
            return;
        });

        await interaction.reply({ embeds: [embed] });
    }
}