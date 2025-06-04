const { EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { createTranscript } = require("discord-html-transcripts");
const TicketSetup = require("../../schemas/ticketsetup");
const ticketSchema = require("../../schemas/ticket");
const msgConfig = require("../../messageConfig.json");
require('dotenv').config();

const pingStaffButtonState = {};

module.exports = async (client, interaction) => {
    const { guild, member, customId, channel } = interaction;
    const { ManageChannels } = PermissionFlagsBits;

    if (!interaction.isButton()) return;

    if (!["close", "lock", "unlock", "claim", "rename", "pingStaff"].includes(customId)) return;

    const docs = await TicketSetup.findOne({ GuildID: guild.id });

    if (!docs) return;

    const embed = new EmbedBuilder().setColor("Aqua");

    var data = await ticketSchema.findOne({ GuildID: guild.id, ChannelID: channel.id });

    if (!data) return;

    try {
        switch (customId) {
            case "close":
                if (!member.permissions.has(PermissionFlagsBits.Administrator))
                    return interaction.reply({ content: "Only Server Admins can close a ticket!", flags: MessageFlags.Ephemeral });

                if (data.Closed == true)
                    return interaction.reply({ content: "Ticket is already getting deleted...", flags: MessageFlags.Ephemeral });

                const transcript = await createTranscript(channel, {
                    limit: -1,
                    returnBuffer: false,
                    filename: `${member.user.username}-ticket${data.Type}-${data.TicketID}.html`,
                });

                await ticketSchema.updateOne({ GuildID: guild.id, ChannelID: channel.id }, { Closed: true });

                const transcriptEmbed = new EmbedBuilder()
                    .setColor("Orange")
                    .setTitle(`Transcript Type: ${data.Type}\nId: ${data.TicketID}`)
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: member.user.tag, iconURL: member.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp();

                const transcriptProcess = new EmbedBuilder()
                    .setTitle('Saving transcript...')
                    .setDescription("Ticket will be closed in 10 seconds, enable DM's for the ticket transcript.")
                    .setColor("Red")
                    .setTitle(`Transcript Type: ${data.Type}\nId: ${data.TicketID}`)
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(msgConfig.thumbnail)
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                    .setTimestamp();

                const res = await guild.channels.cache.get(docs.Transcripts).send({
                    embeds: [transcriptEmbed],
                    files: [transcript],
                });

                channel.send({ embeds: [transcriptProcess] });

                setTimeout(function () {
                    member.send({
                        embeds: [transcriptEmbed.setDescription(`Access your ticket transcript: ${res.url}`)]
                    }).catch(() => channel.send('Couldn\'t send transcript to Direct Messages.'));
                    channel.delete();
                }, 10000);

                await interaction.reply({ content: `Ticket has been closed by ${interaction.user}` })

                break;

            case "lock":
                if (!member.permissions.has(ManageChannels))
                    return interaction.reply({ content: "You don't have permissions to do that.", flags: MessageFlags.Ephemeral });

                if (data.Locked == true)
                    return interaction.reply({ content: "Ticket is already set to locked.", flags: MessageFlags.Ephemeral });

                await ticketSchema.updateOne({ GuildID: guild.id, ChannelID: channel.id }, { Locked: true });
                embed.setDescription(`Ticket was locked succesfully by ${member} 🔒`)
                    .setColor("Red")
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                data.MembersID.forEach((m) => {
                    channel.permissionOverwrites.edit(m, { SendMessages: false });
                });

                return interaction.reply({ embeds: [embed] });

            case "unlock":
                if (!member.permissions.has(ManageChannels))
                    return interaction.reply({ content: "You don't have permissions to do that.", flags: MessageFlags.Ephemeral });

                if (data.Locked == false)
                    return interaction.reply({ content: "Ticket is already set to unlocked.", flags: MessageFlags.Ephemeral });

                await ticketSchema.updateOne({ GuildID: guild.id, ChannelID: channel.id }, { Locked: false });
                embed.setDescription("Ticket was unlocked succesfully 🔓")
                    .setColor("Green")
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                data.MembersID.forEach((m) => {
                    channel.permissionOverwrites.edit(m, { SendMessages: true });
                });

                return interaction.reply({ embeds: [embed] });

            case "claim":
                if (!member.permissions.has(ManageChannels))
                    return interaction.reply({ content: "You don't have permissions to do that.", flags: MessageFlags.Ephemeral });

                if (data.Claimed == true)
                    return interaction.reply({ content: `Ticket is already claimed by <@${data.ClaimedBy}>`, flags: MessageFlags.Ephemeral });

                await ticketSchema.updateOne({ GuildID: guild.id, ChannelID: channel.id }, { Claimed: true, ClaimedBy: member.id });

                embed.setDescription(`Ticket was succesfully claimed by ${member}`)
                    .setColor("Green")
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                interaction.reply({ embeds: [embed] });

                break;

            case "rename":
                if (!member.permissions.has(ManageChannels))
                    return interaction.reply({ content: "You don't have permissions to do that.", flags: MessageFlags.Ephemeral });

                const modal = new ModalBuilder({
                    customId: `renModal-${interaction.user.id}`,
                    title: 'Rename Ticket',
                })

                const newNameInput = new TextInputBuilder({
                    customId: 'newChannelNameInput',
                    label: 'Input the new channel\'s name: ',
                    style: TextInputStyle.Short,
                });

                const newNameActionRow = new ActionRowBuilder().addComponents(newNameInput);

                modal.addComponents(newNameActionRow);

                await interaction.showModal(modal);


                const filter = (interaction) => interaction.customId === `renModal-${interaction.user.id}`;

                interaction
                    .awaitModalSubmit({ filter, time: 30_000 })
                    .then((modalInteraction) => {
                        const newNameValue = modalInteraction.fields.getTextInputValue('newChannelNameInput')

                        modalInteraction.channel.setName(`${newNameValue}`)

                        embed.setDescription(`:white_check_mark: | Ticket succesfully renamed in **${newNameValue}** !`)
                            .setColor("Green")
                            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                            .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                        modalInteraction.reply({ embeds: [embed] });
                    })
                    .catch((err) => {
                        console.log(`Error: ${err}`);
                    })
                break;

            case "pingStaff":
                if (pingStaffButtonState[interaction.user.id]) {
                    return interaction.reply({ content: "\`⚠️\` You have already pressed this button, please wait for a staff member to respond to you.", flags: MessageFlags.Ephemeral });
                }

                const staffRoleId = process.env.staffRole;

                if (!staffRoleId) {
                    return interaction.reply({ content: "\`❌\` Check .env file staffRole field.", flags: MessageFlags.Ephemeral });
                }

                const staffRole = guild.roles.cache.get(staffRoleId);

                if (!staffRole) {
                    return interaction.reply({ content: "\`❌\` Make sure you entered the correct staff's roleId", flags: MessageFlags.Ephemeral });
                }

                interaction.reply({ content: `User ${member} wants to tag ${staffRole}`, allowedMentions: { roles: [staffRoleId] } });

                pingStaffButtonState[interaction.user.id] = true;
                break;

        }
    } catch (e) {
        console.log(e);
        return await interaction.reply({ content: `\`❌\` An error occurred: ${e}` })
    }
}
