const { PermissionFlagsBits } = require("discord.js");

module.exports = {
    customId: "cancelBtn",
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        interaction.message.delete();
    },
};