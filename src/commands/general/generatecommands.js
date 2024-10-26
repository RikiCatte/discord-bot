const { SlashCommandBuilder } = require("discord.js");
const createBuilder = require("discord-command-builder");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("generate-command")
        .setDescription("Generate comman's code for a discord.js v14 bot command!")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        createBuilder({ interaction: interaction, path: './cache/' }).catch(async err => {
            return await interaction.reply({ content: "\`❌\` There was an error while running the command", ephemeral: true });
        });
    }
}