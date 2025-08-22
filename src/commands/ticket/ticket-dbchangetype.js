const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-dbchangetype")
        .setDescription("Changes the ticket type in DB")
        .addStringOption(option =>
            option.setName("type")
                .setDescription("Choose the new ticket type.")
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

    run: async (client, interaction) => {
        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.ticket;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "ticket");
        if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "ticket", "disabled", false);

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { options } = interaction;
        const newType = options.getString('type');

        try {
            const ticket = serviceConfig.tickets.find(t => t.ChannelID === interaction.channel.id);

            if (!ticket) return await interaction.editReply({ content: `\`❌\` Ticket not found for this channel.` });

            ticket.Type = newType;

            await updateServiceConfig(config, "ticket", { tickets: serviceConfig.tickets });

            return await interaction.editReply({ content: `\`✅\` Succesfully updated ticket type DB variable to **${newType}**` });
        } catch (e) {
            console.log(e);
            await interaction.editReply({ content: `\`❌\` Something went wrong! -> ${e}`, flags: MessageFlags.Ephemeral });
        }
    }
}