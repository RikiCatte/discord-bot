const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

function extractVideoIdFromUrl(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('v');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ytmp4')
        .setDescription('Download YouTube videos')
        .addStringOption(option =>
            option.setName('link')
                .setDescription('The YouTube video URL that you want to download')
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;
        const videoUrl = options.getString('link');

        const vidId = extractVideoIdFromUrl(videoUrl);

        if (!vidId) {
            return await interaction.editReply({ content: `\`⚠️\` Invalid YouTube video URL! Please provide a valid URL.` });
        }

        const input = {
            method: "GET",
            url: 'https://youtube-video-download-info.p.rapidapi.com/dl',
            params: { id: vidId },
            headers: {
                'X-RapidAPI-Key': process.env.ytmp4Api,
                'X-RapidApi-Host': 'youtube-video-download-info.p.rapidapi.com'
            }
        };

        try {
            const output = await axios.request(input);
            const link = output.data.link[22];

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('👉 | Download MP4')
                        .setStyle(ButtonStyle.Link)
                        .setURL(link[0])
                );

            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setDescription(`\`📹\` Download the MP4 version of \`${output.data.title}\` below!`);

            await interaction.editReply({ embeds: [embed], components: [button] });
        } catch (e) {
            console.log(e);
            await interaction.editReply({ content: `\`⚠️\` The video link you provided is invalid, input a correct one!` });
        }
    }
}