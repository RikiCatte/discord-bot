const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js')
const BotConfig = require("../../schemas/BotConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-dbdelete')
        .setDescription('Delete all tickets from db')
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    run: async (client, interaction) => {
        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.ticket;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "ticket");
        if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "ticket", "disabled", false);

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            const ticketCount = serviceConfig.tickets.length;

            await updateServiceConfig(config, "ticket", { tickets: [] });

            await interaction.editReply({ content: `\`✅\` Succesfully deleted ${ticketCount} tickets from DB`, flags: MessageFlags.Ephemeral });
        } catch (e) {
            console.log(e);
            await interaction.editReply({ content: `\`❌\` Something went wrong! -> ${e}`, flags: MessageFlags.Ephemeral });
        }
    },
}