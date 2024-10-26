const { EmbedBuilder, SlashCommandBuilder } = require('discord.js')
const cpuStat = require("cpu-stat");
require('dotenv').config();
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription("Get information about the bot.")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: (client, interaction) => {
        const days = Math.floor(client.uptime / 86400000)
        const hours = Math.floor(client.uptime / 3600000) % 24
        const minutes = Math.floor(client.uptime / 60000) % 60
        const seconds = Math.floor(client.uptime / 1000) % 60

        cpuStat.usagePercent(function (error, percent) {
            if (error) return interaction.reply({ content: `${error}` })

            const memoryUsage = formatBytes(process.memoryUsage().heapUsed)
            const node = process.version
            const cpu = percent.toFixed(2)

            const botCreationTimestamp = client.user.createdTimestamp;
            const botCreationDate = new Date(botCreationTimestamp);

            const embed = new EmbedBuilder()
                .setTitle("Bot information")
                .setColor("Blue")
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setThumbnail(msgConfig.thumbnail)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                .addFields(
                    { name: "Developer", value: `<@${process.env.developerId}>`, inline: true },
                    { name: "Username", value: `${client.user.username}`, inline: true },
                    { name: "ID:", value: `${client.user.id}`, inline: true },
                    { name: "Creation Date", value: `${botCreationDate}` },
                    { name: "Help Command", value: `/${process.env.helpCommand}` },
                    { name: "Uptime", value: `\`${days}\` days, \`${hours}\` hours, \`${minutes}\` minutes and \`${seconds}\` seconds.` },
                    { name: "Bot-Ping", value: `${client.ws.ping}ms` },
                    { name: "Node Version", value: `${node}` },
                    { name: "CPU Usage", value: `${cpu}%` },
                    { name: "Memory usage", value: `${memoryUsage}` }
                )
                .setTimestamp();

            interaction.reply({ embeds: [embed] });
        })

        function formatBytes(a, b) {
            let c = 1024;
            d = b || 2;
            e = ['B', 'KB', 'MB', 'GB', 'TB'];
            f = Math.floor(Math.log(a) / Math.log(c));

            return parseFloat((a / Math.pow(c, f)).toFixed(d)) + '' + e[f];
        }
    }
}