const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ytmp3')
        .setDescription('Download soundtracks of Youtube Videos')
        .addStringOption(option => option.setName('link').setDescription('Video\'s Link').setRequired(true))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true })

        const { options } = interaction;
        const link = options.getString('link');

        const input = {
            method: 'GET',
            url: 'https://youtube-mp3-downloader2.p.rapidapi.com/ytmp3/ytmp3/',
            params: {
                url: `${link}`
            },
            headers: {
                'X-RapidAPI-Key': `${process.env.ytmp3Api}`,
                'X-RapidAPI-Host': 'youtube-mp3-downloader2.p.rapidapi.com'
            }
        };

        try {
            const response = await axios.request(input);

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(`💾 | Download MP3 version`)
                        .setStyle(ButtonStyle.Link)
                        .setURL(response.data.dlink)
                );

            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setDescription(`\`👇\` Click below to get your MP3 version of \`${response.data.title}\``)

            await interaction.editReply({ embeds: [embed], components: [button] });
        } catch (e) {
            console.log(e);
            await interaction.editReply({ content: `\`⚠️\` That link does not exist! Provide a correct one!` });
        }
    }
}