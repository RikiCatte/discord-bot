const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("uptime")
        .setDescription("Shows bot's uptime")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],


    run: async (client, interaction) => {
        const days = Math.floor(client.uptime / 86400000)
        const hours = Math.floor(client.uptime / 3600000) % 24
        const minutes = Math.floor(client.uptime / 60000) % 60
        const seconds = Math.floor(client.uptime / 1000) % 60

        const embed = new EmbedBuilder()
            .setTitle(`__${client.user.username}'s uptime__`)
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(msgConfig.thumbnail)
            .setColor("Blue")
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
            .setTimestamp()
            .addFields({
                name: "Uptime", value: ` \`${days}\` days, \`${hours}\` hours, \`${minutes}\` minutes and \`${seconds}\` seconds.`
            })

        interaction.reply({ embeds: [embed] })
    }
}