const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceNotEnabled = require("../../utils/BotConfig/replyServiceNotEnabled");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bug-report")
        .setDescription("Send a bug report to bot devs")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        if (!interaction.guild) return await interaction.reply({ content: "\`⚠️\` Please report this bug within a server", flags: MessageFlags.Ephemeral });

        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.bugreport;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "bugreport");
        if (!serviceConfig.enabled) return await replyServiceNotEnabled(interaction, "bugreport");

        const modal = new ModalBuilder()
            .setTitle("Bug & Command Abuse Reporting")
            .setCustomId("bugReport")

        const command = new TextInputBuilder()
            .setCustomId("type")
            .setRequired(true)
            .setPlaceholder("Please only state the problematic feature")
            .setLabel("What feature has a bug or is being abused?")
            .setStyle(TextInputStyle.Short);

        const description = new TextInputBuilder()
            .setCustomId("description")
            .setRequired(true)
            .setPlaceholder("Be sure to be as detailed as possible so the DEVs can take action")
            .setLabel("Describe the bug or abuse")
            .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(
            new ActionRowBuilder().addComponents(command),
            new ActionRowBuilder().addComponents(description)
        );

        try {
            await interaction.showModal(modal);
        } catch (err) {
            await interaction.reply({ content: "\`❌\` There was an error showing the modal. Please try again later.", flags: MessageFlags.Ephemeral });
        }
    }
}