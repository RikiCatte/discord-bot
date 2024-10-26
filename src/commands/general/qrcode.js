const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('qr-code')
        .setDescription('Create a QR Code')
        .addStringOption(option => option.setName('url').setDescription('The URL for the QR Code').setRequired(true))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;
        const url = options.getString('url');

        const input = {
            method: 'GET',
            url: 'https://codzz-qr-cods.p.rapidapi.com/getQrcode',
            params: {
                type: 'url',
                value: url
            },
            headers: {
                'X-RapidAPI-Key': process.env.qrcodeApi,
                'X-RapidAPI-Host': 'codzz-qr-cods.p.rapidapi.com'
            }
        };

        try {
            const output = await axios.request(input);

            const embed = new EmbedBuilder()
                .setColor('Blurple')
                .setDescription(`Here you are your QR Code for: ${url}`)
                .setImage(output.data.url)
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setThumbnail(msgConfig.thumbnail)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (e) {
            console.log(e);
            return await interaction.editReply({ content: 'That URL is invalid! Try again with a different URL' })
        }
    }
}