const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled")
const msgConfig = require("../../messageConfig.json");

module.exports = async (client, interaction) => {
    if (
        !interaction.isStringSelectMenu() ||
        !interaction.customId ||
        !serviceConfig?.CustomId?.includes(interaction.customId)
    ) return;

    const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
    const serviceConfig = config?.services?.ticket;

    if (!serviceConfig) return await replyNoConfigFound(interaction, "ticket");
    if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "ticket", "enabled", false);

    let selectedCategory;
    if (interaction.values && interaction.values[0]) selectedCategory = interaction.values[0];
    else return;

    const { guild, member, customId } = interaction;
    const { ViewChannel, SendMessages, ManageChannels, ReadMessageHistory } = PermissionFlagsBits;
    let ticketId;

    const messageId = serviceConfig.MessageId;
    const channel = client.channels.cache.get(serviceConfig.Channel);
    if (!channel) return;
    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (message) message.edit("");

    if (!serviceConfig.CustomId.includes(customId)) return;

    if (!guild.members.me.permissions.has(ManageChannels))
        return interaction.reply({ content: "`⚠️` I don't have permissions to do this.", flags: MessageFlags.Ephemeral });

    try {
        const staffRole = guild.roles.cache.get(serviceConfig.Handlers);
        if (!staffRole) return interaction.reply({ content: "`⚠️` Staff role not found, check BotConfig.", flags: MessageFlags.Ephemeral });

        const trimmedSelectedCategory = selectedCategory.trim();
        const categoryIndex = serviceConfig.TicketCategories.indexOf(trimmedSelectedCategory);
        const emojiForCategory = `${serviceConfig.CategoriesEmojiArray[categoryIndex]?.emoji}` || "";

        do {
            ticketId = Math.floor(Math.random() * 9000) + 10000;
        } while (serviceConfig.tickets.some(t => t.TicketID === ticketId.toString()));

        await guild.channels.create({
            name: `『${emojiForCategory}』${member.user.username} ${trimmedSelectedCategory}`,
            type: ChannelType.GuildText,
            parent: serviceConfig.Category,
            permissionOverwrites: [
                {
                    id: serviceConfig.Everyone,
                    deny: [ViewChannel, SendMessages, ReadMessageHistory],
                },
                {
                    id: member.id,
                    allow: [ViewChannel, SendMessages, ReadMessageHistory],
                },
                {
                    id: staffRole.id,
                    allow: [ViewChannel, SendMessages, ReadMessageHistory],
                }
            ],
        }).then(async (ticketChannel) => {
            serviceConfig.tickets.push({
                MembersID: [member.id],
                TicketID: ticketId.toString(),
                ChannelID: ticketChannel.id,
                OpenedAt: Date.now(),
                Closed: false,
                Locked: false,
                Type: trimmedSelectedCategory,
                Claimed: false,
                ClaimedBy: ""
            });

            await updateServiceConfig(config, "ticket", { tickets: serviceConfig.tickets });

            const embed = new EmbedBuilder()
                .setTitle(`User: ${member.user.username} | ID: ${member.id} - Ticket Type: ${trimmedSelectedCategory} | Ticket ID: ${ticketId}`)
                .setDescription("Our team will contact you shortly. Please describe your issue. The buttons below are staff reserved (except that one to ping the staff)")
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setColor("Random")
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            const buttonRow1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('close').setLabel('Close Ticket').setStyle(ButtonStyle.Primary).setEmoji('❌'),
                new ButtonBuilder().setCustomId('lock').setLabel('Lock Ticket').setStyle(ButtonStyle.Secondary).setEmoji('🔐'),
                new ButtonBuilder().setCustomId('unlock').setLabel('Unlock Ticket').setStyle(ButtonStyle.Success).setEmoji('🔓')
            );

            const buttonRow2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('claim').setLabel('Claim Ticket').setStyle(ButtonStyle.Secondary).setEmoji('🛄'),
                new ButtonBuilder().setCustomId('rename').setLabel('Rename Ticket Channel').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
                new ButtonBuilder().setCustomId('pingStaff').setLabel('Ping Staff').setStyle(ButtonStyle.Danger).setEmoji('🔔')
            );

            ticketChannel.send({
                embeds: [embed],
                components: [buttonRow1, buttonRow2]
            });

            interaction.reply({ content: `\`✅\` Succesfully created your ticket! Open it up here 👉 <#${ticketChannel.id}>`, flags: MessageFlags.Ephemeral });
        });
    } catch (err) {
        return console.log(err);
    }
}
