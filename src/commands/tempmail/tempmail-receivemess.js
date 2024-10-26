const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const msgConfig = require("../../messageConfig.json");
require('dotenv').config();
const axios = require('axios');
const tempMailSchema = require('../../schemas/tempmail');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tempmail-receivemess')
        .setDescription('Receive inbox emails by token')
        .addStringOption(option => option.setName('token').setDescription('Input your token to receive inbox messages.').setRequired(true))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;
        const token = options.getString('token');

        const input = {
            method: 'GET',
            url: 'https://tmail2.p.rapidapi.com/messages',
            headers: {
                Authorization: token,
                'X-RapidAPI-Key': process.env.tempmailApi,
                'X-RapidAPI-Host': 'tmail2.p.rapidapi.com'
            }
        };

        let sleep = async (ms) => await new Promise(r => setTimeout(r, ms));
        await sleep(2000);

        try {
            const output = await axios.request(input);
            let id;

            try {
                id = output.data.messages[0]._id;
            } catch (e) {
                return await interaction.editReply({ content: '\`⚠️\` Inbox is empty or token is invalid!', ephemeral: true });
            }

            for (let i = 0; i < output.data.messages.length; i++) {
                await tempMailSchema.create({
                    Email: output.data.mailbox,
                    Token: token,
                    MessagesAmount: output.data.messages.length,
                    OwnerDiscordID: interaction.user.id,
                    ProgressiveNumber: i,
                    ID: output.data.messages[i]._id,
                    ReceivedAt: output.data.messages[i].receivedAt,
                    From: output.data.messages[i].from,
                    Subject: output.data.messages[i].subject,
                    Body: output.data.messages[i].bodyPreview,
                    AttachmentsCount: output.data.messages[i].attachmentsCount
                });

                setTimeout(function () {

                }, 300);
            }

            const embed = new EmbedBuilder()
                .setColor('Blurple')
                .setDescription(`\`✅\` | Messages received for: **${output.data.mailbox}**, now use /tempmail-read providing your token to read your messages!`)
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setThumbnail(msgConfig.thumbnail)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });
            await interaction.editReply({ embeds: [embed], ephemeral: true })
        } catch (error) {
            console.error(error);

            return await interaction.editReply({ content: `\`❌\` An error has occured while receiving a mail messages. Try again or contact DEVs` });
        }
    }
}