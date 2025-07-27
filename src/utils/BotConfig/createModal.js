const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require("discord.js");

/**
 * Shows a dynamic modal and returns the entered values.
 * @param {Interaction} interaction
 * @param {Object} options
 * @param {string} options.customId
 * @param {string} options.title
 * @param {Array} options.fields [{ customId, label, style, placeholder, required }]
 * @param {number} [timeout=60000]
 * @returns {Promise<{ success: boolean, values?: Object, modalInteraction?: ModalSubmitInteraction }>}
 */
module.exports = async function createModal(interaction, { customId, title, fields }, timeout = 60000) {
    if (fields.length > 5) {
        await interaction.reply({ content: `\`❌\` You can enter a maximum of 5 fields per modal, you entered \`${fields.count}\``, ephemeral: true });
        return { success: false };
    }

    const modal = new ModalBuilder()
        .setCustomId(customId)
        .setTitle(title);

    const rows = fields.map(field => {
        const input = new TextInputBuilder()
            .setCustomId(field.customId)
            .setLabel(field.label)
            .setStyle(field.style || TextInputStyle.Short)
            .setPlaceholder(field.placeholder || "")
            .setRequired(field.required ?? true);

        if (field.minLength != null) input.setMinLength(field.minLength);
        if (field.maxLength != null) input.setMaxLength(field.maxLength);
        if (field.value != null) input.setValue(field.value);

        return new ActionRowBuilder().addComponents(input);
    });

    modal.addComponents(...rows);

    await interaction.showModal(modal);

    try {
        const modalInteraction = await interaction.awaitModalSubmit({
            filter: i => i.customId === customId && i.user.id === interaction.user.id,
            time: timeout
        });

        const values = {};
        for (const field of fields) {
            values[field.customId] = modalInteraction.fields.getTextInputValue(field.customId);
        }

        return { success: true, values, modalInteraction };
    } catch (err) {
        try {
            await interaction.followUp({ content: "\`❌\` Operation cancelled or expired. Try again.", flags: MessageFlags.Ephemeral });
        } catch (e) {
            console.log(e);
        }
        return { success: false };
    }
}