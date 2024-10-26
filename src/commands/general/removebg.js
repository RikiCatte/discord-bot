const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
require('dotenv').config();
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove-bg')
        .setDescription('Remove a background from an image')
        .addAttachmentOption(option => option.setName('image').setDescription('The image you want to remove the bg of').setRequired(true))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const image = interaction.options.getAttachment('image');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': process.env.removebgApi,
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({
                image_url: image.proxyURL,
                size: 'auto'
            })
        });

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const attachment = new AttachmentBuilder(buffer, { name: 'remove.png' });

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle('🙃 Removed your images background')
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(msgConfig.thumbnail)
            .setImage('attachment://removebg.png')
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], files: [attachment] });
    }
}