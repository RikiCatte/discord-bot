const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const msgConfig = require("../messageConfig.json");

/**
 * Create the embed and components for the ticket system.
 * @param {Object} setup - TicketSetup document from the DB
 * @param {Object} client - Discord client instance
 * @param {boolean} [disabled=false] - If true, disables the menu
 * @returns {Object} { embed, components }
 */
function buildTicketEmbed(setup, client, disabled = false) {
    const embed = new EmbedBuilder()
        .setColor(setup.EmbedColor || "#5865F2")
        .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img })
        .setThumbnail(msgConfig.thumbnail)
        .setDescription(setup.Description || "No description provided.")
        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

    const categories = setup.TicketCategories || [];
    const emojis = setup.Emojis || [];
    const options = categories.map((category, index) => {
        const emoji = emojis[index % emojis.length] || "";
        return new StringSelectMenuOptionBuilder()
            .setLabel(category)
            .setValue(category)
            .setDescription(`Create a ${category} Type Ticket.`)
            .setEmoji(emoji);
    });

    const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket-stringMenu")
        .setPlaceholder("Select a Category to Create a Ticket")
        .setDisabled(disabled)
        .addOptions(options);

    const components = [new ActionRowBuilder().addComponents(menu)];

    return { embed, components };
}

module.exports = { buildTicketEmbed };