const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const riskyLogsSchema = require("../schemas/riskyLogs");

module.exports = {
    customId: "logSystem",
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const { message } = interaction;

        const log = await riskyLogsSchema.findOne({ RiskyLogID: message.id });
        if (!log || log.Solved) return interaction.reply({ content: "Log not found in db", ephemeral: true });

        if (interaction.customId && interaction.customId == "logSystem") {
            await riskyLogsSchema.updateOne({ RiskyLogID: message.id }, { Solved: true, SolvedBy: interaction.user.id });

            const disabledRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`logSystem`)
                    .setStyle(ButtonStyle.Success)
                    .setDisabled(true)
                    .setLabel("✅ Mark as Solved")
            );
            message.edit({ content: `This Security issue has been marked solved by ${interaction.user} (${interaction.user.id})`, components: [disabledRow] });

            return await interaction.reply({ content: "✅ Log Marked as Fixed", ephemeral: true });
        }
    },
};