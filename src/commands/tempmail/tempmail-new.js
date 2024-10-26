const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const msgConfig = require("../../messageConfig.json");
const axios = require('axios');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tempmail-new')
        .setDescription('Get a Disposable Email Address')
        .addBooleanOption(option =>
            option.setName('send')
                .setDescription('Sends token as separated message, higly suggested if you\'re from mobile')
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run :async(client, interaction)=> {
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;
        const choose = options.getBoolean('send')

        const input = {
            method: 'GET',
            url: 'https://tmail2.p.rapidapi.com/mailbox',
            headers: {
                'X-RapidAPI-Key': process.env.tempmailApi,
                'X-RapidAPI-Host': 'tmail2.p.rapidapi.com'
            }
        };

        let sleep = async (ms) => await new Promise(r => setTimeout(r, ms));
        await sleep(1500);

        try {
            const output = await axios.request(input);

            if (output.data.mailbox === undefined)
                return await interaction.editReply({ content: 'Error: ' + output.data.errorMessage + ' / ' + output.data.errorName, ephemeral: true });

            const embed = new EmbedBuilder()
                .setColor('Blurple')
                .setDescription(`\`📧\` Here it is your temp mail address: **${output.data.mailbox}**, with token: ${output.data.token}`)
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setThumbnail(msgConfig.thumbnail)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            console.log('Requested by: ' + interaction.user.tag + " , " + interaction.user);
            console.log(output.data);
            await interaction.editReply({ embeds: [embed], ephemeral: true })

            if (choose) {
                if (interaction.user) {
                    try {
                        interaction.user.send(output.data.token)
                        interaction.editReply({ content: '\`✅\` Token has been sent in DMs, make sure that they\'re enabled by your side!', ephemeral: true });
                    } catch (e) {
                        console.log(e);
                        interaction.editReply({ conent: '\`❌\` There was an error: ' + e });
                    }
                }
            }

        } catch (error) {
            console.error(error);

            return await interaction.editReply({ content: `\`❌\` An error has occured while getting a tempmail address. Try again or contact DEVs` });
        }
    },
}