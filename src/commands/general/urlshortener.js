const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const msgConfig = require("../../messageConfig.json");
const { disabled } = require('./translate');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('url-shortener')
        .setDescription('Shorten a URL')
        .addStringOption(option => option.setName('link').setDescription('The link to shorten').setRequired(true))
        .addStringOption(option => option.setName('alias').setDescription('The alias for your shortened URL'))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    disabled: true,

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;
        const link = options.getString('link');
        let alias = options.getString('alias') || '';

        const input = {
            method: 'POST',
            url: 'https://url-shortener23.p.rapidapi.com/shorten',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': process.env.urlshortenerApi,
                'X-RapidAPI-Host': 'url-shortener23.p.rapidapi.com'
            },
            data: {
                url: link,
                alias: alias
            }
        };

        try {
            const output = await axios.request(input);

            const embed = new EmbedBuilder()
                .setColor('Blurple')
                .setDescription(`🔗 | Here it is your shortened link for \`${link}\`: ${output.data.short_url}`)
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setThumbnail(msgConfig.thumbnail)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            await interaction.editReply({ embeds: [embed] });
        } catch (e) {
            console.log(e);

            if (e.statusCode === 400) {
                return await interaction.editReply({ content: `❌ | The alias \`${alias}\` is already in use` });
            } else {
                return await interaction.editReply({ content: `❌ | An error has occured while shortening your URL. Try again or contact DEVs` });
            }
        }
    }
}