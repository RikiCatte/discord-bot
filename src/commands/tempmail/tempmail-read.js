const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const msgConfig = require("../../messageConfig.json");
require('dotenv').config();
const axios = require('axios');
const tempmailSchema = require('../../schemas/tempmail');
let id;
let interact;
let inbox;
var i = 0;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tempmail-read')
        .setDescription('Read inbox emails by token')
        .addStringOption(option => option.setName('token').setDescription('Input your token to read inbox messages.').setRequired(true))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        interact = interaction;
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;
        const token = options.getString('token');

        if (!process.env.tempmailApi) {
            return await interaction.editReply({ content: '\`⚠️\` Missing tempmailApi key in environment variables. Please configure the API key.', ephemeral: true });
        }

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
            let length;

            try {
                length = output.data.messages.length;
            } catch (e) {
                return await interaction.channel.send({ content: 'Tempmail has probably expired, create a new one with /tempmail-new', ephemeral: true })
            }

            try {
                id = output.data.messages[i]._id;
                inbox = output.data.mailbox;
            } catch (e) {
                return await interaction.editReply({ content: 'Inbox is empty or token / index is invalid!', ephemeral: true });
            }

            let sleep = async (ms) => await new Promise(r => setTimeout(r, ms));
            await sleep(2000);

            const button = new ActionRowBuilder().setComponents(
                new ButtonBuilder().setCustomId('previous').setLabel('Previous Email').setStyle(ButtonStyle.Primary).setEmoji('⏮️'),
                new ButtonBuilder().setCustomId('x').setLabel('Close Buttons').setStyle(ButtonStyle.Secondary).setEmoji('❌'),
                new ButtonBuilder().setCustomId('next').setLabel('Next Email').setStyle(ButtonStyle.Primary).setEmoji('⏭️')
            );

            const embed = new EmbedBuilder()
                .setColor('Blurple')
                .setDescription(`📫 | Inbox of: **${output.data.mailbox}**, There are ${length} messages, showing the ${i}:`)
                .addFields(
                    { name: 'Progressive Number', value: `${i}/${length - 1}` },
                    { name: 'ID', value: `${output.data.messages[i]._id}`, inline: true },
                    { name: 'Received At', value: `${output.data.messages[i].receivedAt}` },
                    { name: 'From', value: `${output.data.messages[i].from}`, inline: true },
                    { name: 'Subject', value: `${output.data.messages[i].subject}` },
                    { name: 'Body', value: `${output.data.messages[i].bodyPreview}` },
                    { name: 'Attachments Count', value: `${output.data.messages[i].attachmentsCount}` }
                )
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setThumbnail(msgConfig.thumbnail)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            await interaction.editReply({ embeds: [embed], components: [button], ephemeral: true });
        } catch (error) {
            console.error(error);

            return await interaction.channel.send({ content: `\`❌\` An error has occured while reading inbox emails. Try again or contact DEVs`, ephemeral: true });
        }
    },

    sendId: function () {
        return id;
    },

    sendInteraction: function () {
        return interact;
    },

    sendInbox: function () {
        return inbox;
    },

    sendProgressiveNumber: function () {
        return i;
    },

    showData: async function (inbox, progNumber) {    
        try {
            const data = await tempmailSchema.findOne({ Email: inbox, ProgressiveNumber: progNumber });
    
            if (!data) {
                console.log("showData() error, no data found");
                await interact.editReply("\`❌\` No data found");
                return -1;
            }
    
            const embed = new EmbedBuilder()
                .setColor('Blurple')
                .setDescription(`📫 | Inbox of: **${data.Email}**, There are ${data.MessagesAmount} messages, showing the ${progNumber}:`)
                .addFields(
                    { name: 'Progressive Number', value: `${progNumber}/${data.MessagesAmount - 1}` },
                    { name: 'ID', value: `${data.ID}`, inline: true },
                    { name: 'Received At', value: `${data.ReceivedAt}` },
                    { name: 'From', value: `${data.From}`, inline: true },
                    { name: 'Subject', value: `${data.Subject}` },
                    { name: 'Body', value: `${data.Body}` },
                    { name: 'Attachments Count', value: `${data.AttachmentsCount}` }
                )
                .setAuthor({ name: `ciao`, iconURL: msgConfig.author_img })
                .setThumbnail(msgConfig.thumbnail)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });
    
            await interact.editReply({ embeds: [embed], ephemeral: true });
    
            return 0;
        } catch (err) {
            console.error(err);
            await interact.editReply(`\`❌\` An error occurred: ${err.message}`);
            return -1;
        }
    },
    
    id,
}