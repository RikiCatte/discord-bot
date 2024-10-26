const { SlashCommandBuilder } = require("discord.js");
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("translate")
        .setDescription("Translate something using Google")
        .addStringOption(option =>
            option.setName("target-lang")
                .setDescription("Choose the target language, e.g. en / es / it")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("source-lang")
                .setDescription("Choose the source language, e.g. en / es / it, (API's Auto Detect Language method is buggy))")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("text")
                .setDescription("The text you want to translate")
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;
        const text = options.getString('text');

        const encodedParams = new URLSearchParams();
        encodedParams.set('q', options.getString("text"));
        encodedParams.set('target', options.getString("target-lang"));
        encodedParams.set('source', options.getString("source-lang"));

        const request = {
            method: 'POST',
            url: 'https://google-translate1.p.rapidapi.com/language/translate/v2',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'Accept-Encoding': 'application/gzip',
                'X-RapidAPI-Key': `${process.env.translatorApi}`,
                'X-RapidAPI-Host': 'google-translate1.p.rapidapi.com'
            },
            data: encodedParams,
        };

        try {
            const response = await axios.request(request);
            await interaction.editReply({ content: response.data.data.translations[0].translatedText, ephemeral: true })
        } catch (error) {
            console.error(error);
        }
    }
}