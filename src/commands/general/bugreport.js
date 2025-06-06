const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bug-report")
        .setDescription("Send a bug report to bot devs")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        if (!interaction.guild) return await interaction.reply({ content: "⚠️ Please report this bug within a server", flags: MessageFlags.Ephemeral })

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

        const one = new ActionRowBuilder().addComponents(command);
        const two = new ActionRowBuilder().addComponents(description);

        modal.addComponents(one, two);
        await interaction.showModal(modal);
    }
}