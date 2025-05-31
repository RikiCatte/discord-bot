const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require("discord.js");
const ticketSchema = require("../../schemas/ticket");
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
        const { guildId, options, channel } = interaction;

        const action = options.getString("action");
        const member = options.getUser("member");

        const embed = new EmbedBuilder()

        try {
            switch (action) {
                case "add":
                    var data = await ticketSchema.findOne({ GuildID: guildId, ChannelID: channel.id });

                    if (!data)
                        return interaction.reply({
                            embeds: [
                                embed.setColor("Red")
                                    .setDescription("\`❌\` Something went wrong. Try again later.")
                                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                                    .setThumbnail(msgConfig.thumbnail)
                                    .setTimestamp()
                                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                            ], flags: MessageFlags.Ephemeral
                        });

                    if (data.MembersID.includes(member.id))
                        return interaction.reply({
                            embeds: [
                                embed.setColor("Red")
                                    .setDescription("\`❌\` Something went wrong. Try again later.")
                                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                                    .setThumbnail(msgConfig.thumbnail)
                                    .setTimestamp()
                                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                            ], flags: MessageFlags.Ephemeral
                        });

                    data.MembersID.push(member.id);

                    channel.permissionOverwrites.edit(member.id, {
                        SendMessages: true,
                        ViewChannel: true,
                        ReadMessageHistory: true
                    });

                    interaction.reply({
                        embeds: [
                            embed.setColor("Green")
                                .setDescription(`\`✅\` ${member} has been added to the ticket.`)
                                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                                .setTimestamp()
                                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                        ]
                    });

                    data.save();

                    break;
                case "remove":
                    var data = await ticketSchema.findOne({ GuildID: guildId, ChannelID: channel.id })

                    if (!data)
                        return interaction.reply({
                            embeds: [
                                embed.setColor("Red")
                                    .setDescription("\`❌\` Something went wrong. Try again later.")
                                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                                    .setThumbnail(msgConfig.thumbnail)
                                    .setTimestamp()
                                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                            ], flags: MessageFlags.Ephemeral
                        });

                    if (!data.MembersID.includes(member.id))
                        return interaction.reply({
                            embeds: [
                                embed.setColor("Red")
                                    .setDescription("\`❌\` Something went wrong. Try again later.")
                                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                                    .setThumbnail(msgConfig.thumbnail)
                                    .setTimestamp()
                                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                            ], flags: MessageFlags.Ephemeral
                        });

                    data.MembersID.remove(member.id);

                    channel.permissionOverwrites.edit(member.id, {
                        SendMessages: false,
                        ViewChannel: false,
                        ReadMessageHistory: false
                    });

                    interaction.reply({
                        embeds: [
                            embed.setColor("Green")
                                .setDescription(`\`✅\` ${member} has been removed to the ticket.`)
                                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                                .setTimestamp()
                                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                        ]
                    });

                    data.save();

                    break;
            }
        } catch (e) {
            console.log(e);
            return await interaction.reply({ content: `\`❌\` Something went wrong: ${e}` })
        }
    }
}