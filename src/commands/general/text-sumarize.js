const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js')
const axios = require('axios');
require('dotenv').config();
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('text-sumarize')
        .setDescription('Sumarize text')
        .addStringOption(option => option.setName('text').setDescription('Text to sumarize').setRequired(true))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const { options } = interaction;
        const text = options.getString('text');

        if (text.length > 1024) {
            return await interaction.editReply({ content: `You entered too much chars, the limit is **1024**, you entered ${text.length}` });
        }

        const input = {
            method: 'POST',
            url: 'https://gpt-summarization.p.rapidapi.com/summarize',
            headers: {
                'content-type': 'application/json',
                'X-RapidAPI-Key': process.env.sumarizeraiApi,
                'X-RapidAPI-Host': 'gpt-summarization.p.rapidapi.com'
            },
            data: {
                text: text,
                num_setences: 3
            }
        };

        try {
            const output = await axios.request(input);

            const embed = new EmbedBuilder()
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setDescription(output.data.summary)
                .setColor("Blurple")
                .setThumbnail(msgConfig.thumbnail)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (e) {
            console.log(e);
            if (e.response && e.response.status === 503) {
                await interaction.editReply({ content: 'The sumarization service is currently unavailable, try again later or contact DEVs' });
            } else {
                await interaction.editReply({ content: 'There was an error, please contact DEVs or try again later' });
            }
        }
    }
}