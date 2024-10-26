const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Pong")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: (client, interaction) => {
        interaction.reply({ content: "Pong", ephemeral: true });
    },
};