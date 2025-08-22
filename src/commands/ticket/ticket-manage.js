const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-manage")
        .setDescription("Ticket actions")
        .addStringOption(option =>
            option.setName("action")
                .setDescription("Add or remove members from the ticket.")
                .setRequired(true)
                .addChoices(
                    { name: "Add", value: "add" },
                    { name: "Remove", value: "remove" }
                )
        )
        .addUserOption(option =>
            option.setName("member")
                .setDescription("Select a member from the discord server to perform the action on.")
                .setRequired(true)
        ).toJSON(),
    userPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

    run: async (client, interaction) => {
        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.ticket;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "ticket");
        if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "ticket", "disabled", false);

        const { options, channel } = interaction;
        const action = options.getString("action");
        const member = options.getUser("member");
        const embed = new EmbedBuilder();

        const ticket = serviceConfig.tickets.find(t => t.ChannelID === channel.id);

        if (!ticket)
            return interaction.reply({
                embeds: [
                    embed.setColor("Red")
                        .setDescription("\`❌\` Ticket not found for this channel.")
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                        .setThumbnail(msgConfig.thumbnail)
                        .setTimestamp()
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                ], flags: MessageFlags.Ephemeral
            });

        try {
            switch (action) {
                case "add":
                    if (ticket.MembersID.includes(member.id))
                        return interaction.reply({
                            embeds: [
                                embed.setColor("Red")
                                    .setDescription("\`❌\` Member is already in the ticket.")
                                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                                    .setThumbnail(msgConfig.thumbnail)
                                    .setTimestamp()
                                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                            ], flags: MessageFlags.Ephemeral
                        });

                    ticket.MembersID.push(member.id);

                    await channel.permissionOverwrites.edit(member.id, {
                        SendMessages: true,
                        ViewChannel: true,
                        ReadMessageHistory: true
                    });

                    await updateServiceConfig(config, "ticket", { tickets: serviceConfig.tickets });

                    return interaction.reply({
                        embeds: [
                            embed.setColor("Green")
                                .setDescription(`\`✅\` ${member} has been added to the ticket.`)
                                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                                .setTimestamp()
                                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                        ]
                    });

                case "remove":
                    if (!ticket.MembersID.includes(member.id))
                        return interaction.reply({
                            embeds: [
                                embed.setColor("Red")
                                    .setDescription("\`❌\` Member is not in the ticket.`")
                                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                                    .setThumbnail(msgConfig.thumbnail)
                                    .setTimestamp()
                                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                            ], flags: MessageFlags.Ephemeral
                        });

                    ticket.MembersID = ticket.MembersID.filter(id => id !== member.id);

                    await channel.permissionOverwrites.edit(member.id, {
                        SendMessages: false,
                        ViewChannel: false,
                        ReadMessageHistory: false
                    });

                    await updateServiceConfig(config, "ticket", { tickets: serviceConfig.tickets });

                    return interaction.reply({
                        embeds: [
                            embed.setColor("Green")
                                .setDescription(`\`✅\` ${member} has been removed from the ticket.`)
                                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                                .setTimestamp()
                                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                        ]
                    });
            }
        } catch (e) {
            console.log(e);
            return await interaction.reply({ content: `\`❌\` Something went wrong: ${e}` });
        }
    }
}