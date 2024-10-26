const { PermissionFlagsBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

module.exports = {
    customId: "tempbanBtn",
    userPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],

    run: async (client, interaction) => {
        try {
            const tempBanModal = new ModalBuilder()
                .setTitle("Temp Ban")
                .setCustomId("tempbanMdl")
                .setComponents(
                    new ActionRowBuilder().setComponents(
                        new TextInputBuilder()
                            .setLabel("Time")
                            .setCustomId("tempbanTime")
                            .setPlaceholder("h for hour, d for day, m month, y for year")
                            .setStyle(TextInputStyle.Short)
                    ),
                    new ActionRowBuilder().setComponents(
                        new TextInputBuilder()
                            .setLabel("Reason")
                            .setCustomId("tempbanReason")
                            .setPlaceholder("Reasoning to tempban this user")
                            .setStyle(TextInputStyle.Paragraph)
                    )
                );

            return await interaction.showModal(tempBanModal);
        } catch (error) {
            console.log(error);
        }
    },
};
