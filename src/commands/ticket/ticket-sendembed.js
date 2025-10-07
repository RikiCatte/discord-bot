const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { buildTicketEmbed } = require("../../utils/utils.js");
const BotConfig = require("../../schemas/BotConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");
const updateServiceConfig = require('../../utils/BotConfig/updateServiceConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-sendembed")
        .setDescription("Send the ticket embed message in the channel specified in DB and delete the old message if present.")
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    run: async (client, interaction) => {
        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.ticket;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "ticket");
        if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "ticket", "disabled", false);

        const { guild } = interaction;

        try {
            if (!serviceConfig.Channel) return await interaction.reply({ content: `\`🔴\` No channel where to send the embed is specified in DB`, flags: MessageFlags.Ephemeral });
            const channel = guild.channels.cache.get(serviceConfig.Channel);

            if (serviceConfig.MessageId) {
                const oldMessage = await channel.messages.fetch(serviceConfig.MessageId);

                if (oldMessage) await oldMessage.delete().catch((error) => console.log("[ticket-resendmessage.js]: ", error));
            }

            const { embed, components } = buildTicketEmbed(serviceConfig, client, false);
            const embedMessage = await channel.send({
                embeds: [embed],
                components
            });

            serviceConfig.MessageId = embedMessage.id;

            await updateServiceConfig(config, "ticket", serviceConfig);

            return await interaction.reply({ content: `\`✅\` The ticket embed message has been successfully resent in ${channel}. Please manually check that the old message has been deleted.`, flags: MessageFlags.Ephemeral });
        } catch (err) {
            console.log("[ticket-resendmessage.js]: ", err);
            return await interaction.reply({ content: `\`❌\` An unexpected error occurred while processing your request.`, flags: MessageFlags.Ephemeral });
        }
    }
}