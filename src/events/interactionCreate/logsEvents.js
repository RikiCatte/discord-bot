const { EmbedBuilder, ChatInputCommandInteraction } = require("discord.js");

require('dotenv').config();
const msgConfig = require("../../messageConfig.json");

/**
 * 
 * @param {Client} client 
 * @param {ChatInputCommandInteraction} interaction 
 * @returns 
 */
module.exports = async (client, interaction) => {
    if (!interaction || !interaction.isChatInputCommand() || !interaction.inGuild()) return;

    const channelToWrite = await client.channels.cache.get(msgConfig.commandsUsedLogsChannel);
    const server = interaction.guild.name;
    const user = interaction.user.username;
    const userID = interaction.user.id;
    const targetChannel = interaction.channelId;

    const embed = new EmbedBuilder()
        .setColor("Green")
        .setTitle('❗ Chat Command Used!')
        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
        .setThumbnail(msgConfig.thumbnail)
        .addFields({ name: 'Server Name', value: `${server}` })
        .addFields({ name: 'Chat Command', value: `${interaction}` })
        .addFields({ name: 'Command User', value: `${user} / Discord ID: ${userID}` })
        .addFields({ name: 'Channel in which it was used', value: `<#${targetChannel}> / ${targetChannel}` })
        .setTimestamp()
        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

    await channelToWrite.send({ embeds: [embed] });
}