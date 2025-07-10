const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { buildTicketEmbed } = require("../../utils/ticketEmbed");
const TicketSetup = require("../../schemas/ticketsetup");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-resendmessage")
        .setDescription("Resend the ticket embed message in the channel specified in DB and delete the old message.")
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    run: async (client, interaction) => {
        const { guild } = interaction;

        try {
            const ticketSetup = await TicketSetup.findOne({ guildId: guild.id });
            if (!ticketSetup) return await interaction.reply({ content: `\`🔴\` No setup found for guild ${guild.id} in DB`, flags: MessageFlags.Ephemeral });

            const channel = guild.channels.cache.get(ticketSetup.Channel);
            if (!channel) return await interaction.reply({ content: `\`🔴\` No channel where to send the embed is specified in DB`, flags: MessageFlags.Ephemeral });

            if (ticketSetup.MessageId) {
                const oldMessage = await channel.messages.fetch(ticketSetup.MessageId).catch(() => null);

                if (oldMessage) await oldMessage.delete().catch(() => null);
            }

            const { embed, components } = buildTicketEmbed(ticketSetup, client, false);
            const embedMessage = await channel.send({
                embeds: [embed],
                components
            });

            ticketSetup.MessageId = embedMessage.id;
            await ticketSetup.save();

            return await interaction.reply({ content: `\`✅\` The ticket embed message has been successfully resent in ${channel} and the old message has been deleted`, flags: MessageFlags.Ephemeral });
        } catch (err) {
            console.log("[ticket-resendmessage.js]: ", err);
            return await interaction.reply({ content: `\`❌\` An unexpected error occurred while processing your request.`, flags: MessageFlags.Ephemeral });
        }
    }
}