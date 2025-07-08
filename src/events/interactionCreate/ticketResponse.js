const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require("discord.js");
const ticketschema = require("../../schemas/ticket");
const TicketSetup = require("../../schemas/ticketsetup");
const msgConfig = require("../../messageConfig.json");
require('dotenv').config();

module.exports = async (client, interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    var selectedCategory;
    if (interaction.values && interaction.values[0]) { // If interaction cames from StringSelectMenuBuilder
        selectedCategory = interaction.values[0];
    } else { // If not cames from StringSelectMenuBuilder
        return;
    }

    const { guild, member, customId } = interaction;
    const { ViewChannel, SendMessages, ManageChannels, ReadMessageHistory } = PermissionFlagsBits;
    const ticketId = Math.floor(Math.random() * 9000) + 10000;

    const data = await TicketSetup.findOne({ GuildID: guild.id });
    const messageId = data.MessageId;
    const channel = client.channels.cache.get(data.Channel);
    const message = await channel.messages.fetch(messageId);
    message.edit("");

    if (!data)
        return;

    if (!data.CustomId.includes(customId)) {
        return;
    }

    if (!guild.members.me.permissions.has(ManageChannels))
        interaction.reply({ content: "I don't have permissions to do this.", flags: MessageFlags.Ephemeral });

    try {
        const staffRole = guild.roles.cache.get(process.env.staffRole);

        if (!staffRole) {
            return interaction.reply({ content: "Staff role not found, check .env file", flags: MessageFlags.Ephemeral });
        }

        //

        const trimmedSelectedCategory = selectedCategory.trim();
        const categoryIndex = data.TicketCategories.indexOf(trimmedSelectedCategory);
        const emojiForCategory = `${data.CategoriesEmojiArray[categoryIndex]?.emoji}` || "";

        await guild.channels.create({
            name: `『${emojiForCategory}』${member.user.username} ${trimmedSelectedCategory}`,
            type: ChannelType.GuildText,
            parent: data.Category,
            permissionOverwrites: [
                {
                    id: data.Everyone,
                    deny: [ViewChannel, SendMessages, ReadMessageHistory],
                },
                {
                    id: member.id,
                    allow: [ViewChannel, SendMessages, ReadMessageHistory],
                },
                {
                    id: staffRole.id, // To allow staff role to access the ticket
                    allow: [ViewChannel, SendMessages, ReadMessageHistory],
                }
            ],
        }).then(async (channel) => {
            await ticketschema.create({
                GuildID: guild.id,
                MembersID: member.id,
                TicketID: ticketId,
                ChannelID: channel.id,
                Closed: false,
                Locked: false,
                Type: selectedCategory,
                Claimed: false,
            });

            const embed = new EmbedBuilder()
                .setTitle(`User: ${member.user.username} | ID: ${member.id} - Ticket: ${selectedCategory} | Ticket ID: ${ticketId}`)
                .setDescription("Our team will contact you shortly. Please describe your issue. The buttons below are staff reserved")
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setColor("Random")
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            const buttonRow1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close').setLabel('Close ticket').setStyle(ButtonStyle.Primary).setEmoji('❌'),
                new ButtonBuilder().setCustomId('lock').setLabel('Lock ticket').setStyle(ButtonStyle.Secondary).setEmoji('🔐'),
                new ButtonBuilder().setCustomId('unlock').setLabel('Unlock ticket').setStyle(ButtonStyle.Success).setEmoji('🔓')
            );

            const buttonRow2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('claim').setLabel('Claim').setStyle(ButtonStyle.Secondary).setEmoji('🛄'),
                new ButtonBuilder().setCustomId('rename').setLabel('Rename').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
                new ButtonBuilder().setCustomId('pingStaff').setLabel('Ping Staff').setStyle(ButtonStyle.Danger).setEmoji('🔔')
            );

            channel.send({
                embeds: [embed],
                components: [buttonRow1, buttonRow2]
            });


            interaction.reply({ content: `Succesfully created a ticket! Open it up here 👉 <#${channel.id}>`, flags: MessageFlags.Ephemeral });
        });
    } catch (err) {
        return console.log(err);
    }
}
