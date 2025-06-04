const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nasa-apod')
        .setDescription('Shows Heart\'s Astronomy Picture of the Day')
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
        

    run: async (client, interaction) => {
        await interaction.deferReply();

        const apiKey = process.env.nasaApi;
        const apiUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

        async function getAPODData() {
            try {
                const response = await axios.get(apiUrl);
                const data = response.data;

                const embed = new EmbedBuilder()
                    .setColor("Blurple")
                    .setDescription(`**${data.title}**`)
                    .addFields(
                        { name: 'Explanation', value: `${data.explanation}` },
                        { name: 'Date', value: `${data.date}` },
                        { name: 'URL', value: `${data.url}`, inline: true },
                        { name: 'HDURL', value: `${data.hdurl}`, inline: true },
                        { name: 'Copyright', value: `${data.copyright}` },
                        { name: 'Media Credit', value: `${data.media_credit}`, inline: true }
                    )
                    .setImage(data.url)
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(msgConfig.thumbnail)
                    .setFooter({ text: `${msgConfig.footer_text}, Powered by api.nasa.gov`, iconURL: msgConfig.footer_iconURL });

                await interaction.editReply({ embeds: [embed] });
            } catch (e) {
                console.error(e);
                return await interaction.reply({ content: 'Something went wrong, please contact Devs', flags: MessageFlags.Ephemeral });
            }
        }

        getAPODData();
    }
}