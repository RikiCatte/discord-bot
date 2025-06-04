const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const msgConfig = require('../../messageConfig.json');

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
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        channel.setRateLimitPerUser(duration).catch(err => {
            console.log(err);

            embed.setColor("Red")
                .setDescription(`An error occurred while setting the slowmode: ${err.message}`);
        });

        await interaction.reply({ embeds: [embed] });
    }
}