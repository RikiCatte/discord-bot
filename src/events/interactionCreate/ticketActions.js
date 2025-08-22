const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { createTranscript } = require("discord-html-transcripts");
const BotConfig = require("../../schemas/BotConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");
const updateServiceConfig = require('../../utils/BotConfig/updateServiceConfig');
const msgConfig = require("../../messageConfig.json");

const pingStaffButtonState = {};

module.exports = async (client, interaction) => {
    const { guild, member, customId, channel } = interaction;
    const { ManageChannels } = PermissionFlagsBits;

    if (!interaction.isButton()) return;
    if (!["close", "lock", "unlock", "claim", "rename", "pingStaff"].includes(customId)) return;

    const config = await BotConfig.findOne({ GuildID: guild.id });
    const serviceConfig = config?.services?.ticket;

    if (!serviceConfig) return await replyNoConfigFound(interaction, "ticket");
    if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "ticket", "disabled", false);

    const ticket = serviceConfig.tickets.find(t => t.ChannelID === channel.id);
    if (!ticket) return;

    const embed = new EmbedBuilder().setColor("Aqua");

    try {
        switch (customId) {
            case "close": {
                if (!member.permissions.has(PermissionFlagsBits.Administrator))
                    return interaction.reply({ content: "`⚠️` Only Server Admins can close a ticket!", flags: MessageFlags.Ephemeral });

                if (ticket.Closed)
                    return interaction.reply({ content: "`⚠️` Ticket is already getting deleted...", flags: MessageFlags.Ephemeral });

                const transcript = await createTranscript(channel, {
                    limit: -1,
                    returnBuffer: false,
                    filename: `${member.user.username}-ticket${ticket.Type}-${ticket.TicketID}.html`,
                });

                ticket.Closed = true;
                await updateServiceConfig(config, "ticket", { tickets: serviceConfig.tickets });

                const transcriptEmbed = new EmbedBuilder()
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setTitle(`Ticket Type: ${ticket.Type}\nTicket ID: ${ticket.TicketID}`)
                    .setDescription([
                        `🧾 Ticket opened by <@${ticket.MembersID[0]}> and closed by <@${member.id}>`,
                        `**Opened at:** ${ticket.OpenedAt ? `<t:${Math.floor(ticket.OpenedAt / 1000)}:F>` : "Unknown"}`,
                        `**Closed at:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                        `**Members:** ${ticket.MembersID.map(id => `<@${id}>`).join(", ")}`,
                        ticket.Claimed ? `**Claimed by:** <@${ticket.ClaimedBy}>` : "",
                        ticket.Locked ? "**Status:** Locked" : "**Status:** Unlocked",
                        ticket.Category ? `**Category:** ${ticket.Category}` : "",
                        ticket.Description ? `**Description:** ${ticket.Description}` : ""
                    ].filter(Boolean).join("\n"))
                    .setColor("Orange")
                    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                    .setTimestamp();

                const transcriptProcess = new EmbedBuilder()
                    .setTitle('Saving transcript...')
                    .setDescription("Ticket will be closed in 10 seconds, enable DM's in order to receive the ticket transcript.")
                    .setColor("Red")
                    .setTitle(`Ticket Type: ${ticket.Type}\nId: ${ticket.TicketID}`)
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(msgConfig.thumbnail)
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                    .setTimestamp();

                const transcriptsChannel = guild.channels.cache.get(serviceConfig.Transcripts);
                const res = await transcriptsChannel.send({
                    embeds: [transcriptEmbed],
                    files: [transcript],
                });

                channel.send({ embeds: [transcriptProcess] });

                setTimeout(function () {
                    const transcriptEmbedForUser = EmbedBuilder.from(transcriptEmbed)
                        .setDescription(`\`👉\` Access your ticket transcript here: ${res.url}\n\n${transcriptEmbed.data.description}`);

                    member.send({
                        embeds: [transcriptEmbedForUser]
                    }).catch(() => channel.send('\`⚠️\` Couldn\'t send transcript to Direct Messages.'));
                    channel.delete();
                }, 10000);

                await interaction.reply({ content: `\`✅\` This ticket has been closed by ${interaction.user}` });
                break;
            }
            case "lock": {
                if (!member.permissions.has(ManageChannels))
                    return interaction.reply({ content: "`⚠️` You don't have permissions to do that.", flags: MessageFlags.Ephemeral });

                if (ticket.Locked)
                    return interaction.reply({ content: "`⚠️` Ticket is already set to locked.", flags: MessageFlags.Ephemeral });

                ticket.Locked = true;
                await updateServiceConfig(config, "ticket", { tickets: serviceConfig.tickets });

                embed.setDescription(`\`🔒\` Ticket was locked succesfully by ${member}`)
                    .setColor("Red")
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                ticket.MembersID.forEach((m) => {
                    channel.permissionOverwrites.edit(m, { SendMessages: false });
                });

                const staffRole = guild.roles.cache.get(serviceConfig.Handlers);

                if (staffRole) channel.permissionOverwrites.edit(staffRole, { SendMessages: true });

                return interaction.reply({ embeds: [embed] });
            }
            case "unlock": {
                if (!member.permissions.has(ManageChannels))
                    return interaction.reply({ content: "`⚠️` You don't have permissions to do that.", flags: MessageFlags.Ephemeral });

                if (!ticket.Locked)
                    return interaction.reply({ content: "`⚠️` Ticket is already set to unlocked.", flags: MessageFlags.Ephemeral });

                ticket.Locked = false;
                await updateServiceConfig(config, "ticket", { tickets: serviceConfig.tickets });

                embed.setDescription("`🔓` Ticket was unlocked successfully")
                    .setColor("Green")
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                ticket.MembersID.forEach((m) => {
                    channel.permissionOverwrites.edit(m, { SendMessages: true });
                });

                return interaction.reply({ embeds: [embed] });
            }
            case "claim": {
                if (!member.permissions.has(ManageChannels))
                    return interaction.reply({ content: "`⚠️` You don't have permissions to do that.", flags: MessageFlags.Ephemeral });

                if (ticket.Claimed)
                    return interaction.reply({ content: `\`⚠️\` Ticket is already claimed by <@${ticket.ClaimedBy}>`, flags: MessageFlags.Ephemeral });

                ticket.Claimed = true;
                ticket.ClaimedBy = member.id;
                await updateServiceConfig(config, "ticket", { tickets: serviceConfig.tickets });

                embed.setDescription(`\`💺\` Ticket was succesfully claimed by ${member}`)
                    .setColor("Green")
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                interaction.reply({ embeds: [embed] });
                break;
            }
            case "rename": {
                if (!member.permissions.has(ManageChannels))
                    return interaction.reply({ content: "`⚠️` You don't have permissions to do that.", flags: MessageFlags.Ephemeral });

                const modal = new ModalBuilder({
                    customId: `renModal-${interaction.user.id}`,
                    title: 'Rename Ticket',
                });

                const newNameInput = new TextInputBuilder({
                    customId: 'newChannelNameInput',
                    label: 'Input the new channel\'s name: ',
                    style: TextInputStyle.Short,
                });

                const newNameActionRow = new ActionRowBuilder().addComponents(newNameInput);

                modal.addComponents(newNameActionRow);

                await interaction.showModal(modal);

                const filter = (i) => i.customId === `renModal-${interaction.user.id}`;

                interaction
                    .awaitModalSubmit({ filter, time: 30_000 })
                    .then((modalInteraction) => {
                        const newNameValue = modalInteraction.fields.getTextInputValue('newChannelNameInput');
                        modalInteraction.channel.setName(`${newNameValue}`);

                        embed.setDescription(`\`✅\` Ticket channel succesfully renamed in **${newNameValue}** !`)
                            .setColor("Green")
                            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                            .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                        modalInteraction.reply({ embeds: [embed] });
                    })
                    .catch((err) => {
                        console.log(`Error: ${err}`);
                    });
                break;
            }
            case "pingStaff": {
                if (pingStaffButtonState[interaction.user.id]) {
                    return interaction.reply({ content: "\`⚠️\` You have already pressed this button, please wait for a staff member to respond to you.", flags: MessageFlags.Ephemeral });
                }

                const staffRoleId = serviceConfig.Handlers;

                const staffRole = guild.roles.cache.get(staffRoleId);

                if (!staffRole) return interaction.reply({ content: "\`❌\` Make sure you entered the correct staff's role ID while configurating the ticket system", flags: MessageFlags.Ephemeral });

                interaction.reply({ content: `User ${member} wants to tag ${staffRole}`, allowedMentions: { roles: [staffRoleId] } });

                pingStaffButtonState[interaction.user.id] = true;
                break;
            }
        }
    } catch (e) {
        console.log(e);
        return await interaction.reply({ content: `\`❌\` An error occurred: ${e}` });
    }
}
