const { ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");

module.exports = function createSelectMenu({ customId, placeholder, options }) {
    if (options.length > 25) {
        console.log(`[createSelectMenu] Tried to create a select menu with ${options.length} options (max 25 allowed by Discord).`);
        throw new Error("Too many options for select menu: Discord allows a maximum of 25.");
    }

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(customId)
            .setPlaceholder(placeholder)
            .addOptions(options)
    );
}