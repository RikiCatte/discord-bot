const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("errortest")
        .setDescription("error test"),
    userPermissions: [],
    botPermissions: [],
    disabled: true,

    run: async (client, interaction) => {
        await interaction.reply({ cnent: interaction.player.id, ephamaeral: true });
    }
}