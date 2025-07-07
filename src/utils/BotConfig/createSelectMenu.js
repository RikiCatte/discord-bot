const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

module.exports = function createSelectMenu({ customId, placeholder, options }) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder)
            .addOptions(options)
    );
}