const { ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");

function chunkArray(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

/**
 * Multi-page modal flow (max 5 fields per modal). Uses a "Continue" button between pages.
 * @param {Interaction} interaction - original ChatInput/MessageComponent interaction that triggers the flow
 * @param {Object} opts
 * @param {string} opts.customId - base custom id (will be suffixed with page index)
 * @param {string} opts.title
 * @param {Array} opts.fields - [{ customId, label, style, placeholder, required, minLength, maxLength, value }]
 * @param {number} timeout - per-step timeout (ms)
 * @returns {Promise<{ success: boolean, values?: Object }>}
 */
module.exports = async function pagedModal(interaction, { customId, title, fields }, timeout = 60000) {
    if (!Array.isArray(fields) || fields.length === 0) return { success: false };

    const pages = chunkArray(fields, 5);
    const allValues = {};
    let currentTrigger = interaction; // the interaction we will call showModal on (first = original)
    try {
        for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
            const pageFields = pages[pageIndex];
            const pageId = `${customId}:page:${pageIndex}`;

            // build modal for this page
            const modal = new ModalBuilder()
                .setCustomId(pageId)
                .setTitle(`${title} — ${pageIndex + 1}/${pages.length}`);

            const rows = pageFields.map(f => {
                const txt = new TextInputBuilder()
                    .setCustomId(f.customId)
                    .setLabel(f.label)
                    .setStyle(f.style === 'PARAGRAPH' || f.style === TextInputStyle.Paragraph ? TextInputStyle.Paragraph : TextInputStyle.Short)
                    .setPlaceholder(f.placeholder ?? "")
                    .setRequired(f.required ?? true);

                if (f.minLength != null) txt.setMinLength(f.minLength);
                if (f.maxLength != null) txt.setMaxLength(f.maxLength);
                if (f.value != null) txt.setValue(f.value);

                return new ActionRowBuilder().addComponents(txt);
            });

            modal.addComponents(...rows);

            // show modal on the current trigger (first: original interaction; subsequent: button interaction)
            await currentTrigger.showModal(modal);

            // wait for modal submit
            const modalSubmit = await currentTrigger.awaitModalSubmit({
                filter: i => i.customId === pageId && i.user.id === interaction.user.id,
                time: timeout
            });

            // collect values from this page
            for (const f of pageFields) {
                try {
                    allValues[f.customId] = modalSubmit.fields.getTextInputValue(f.customId);
                } catch (e) {
                    allValues[f.customId] = null;
                }
            }

            // if there are more pages, ask the user to click the button (ephemeral reply with button)
            if (pageIndex < pages.length - 1) {
                const nextCustom = `${customId}:next:${pageIndex + 1}`;
                const nextButton = new ButtonBuilder()
                    .setCustomId(nextCustom)
                    .setLabel("Next Page")
                    .setStyle(ButtonStyle.Primary);

                const row = new ActionRowBuilder().addComponents(nextButton);

                await modalSubmit.reply({
                    content: `\`⌛\` Page \`${pageIndex + 1}\` completed, please click the button below to proceed.`,
                    components: [row],
                    flags: MessageFlags.Ephemeral
                });
                const replyMsg = await modalSubmit.fetchReply();

                const btnInteraction = await replyMsg.awaitMessageComponent({
                    filter: i => i.user.id === interaction.user.id && i.customId === nextCustom,
                    time: timeout
                });

                currentTrigger = btnInteraction;
            } else await modalSubmit.reply({ content: "`✅` Modal completed, thank you!", flags: MessageFlags.Ephemeral }).catch(() => { });
        }

        return { success: true, values: allValues, modalInteraction: currentTrigger };

    } catch (err) {
        try {
            if (currentTrigger && !currentTrigger.replied && !currentTrigger.deferred) {
                await currentTrigger.reply({ content: "`❌` Operation aborted or timed out.", flags: MessageFlags.Ephemeral });
            }
        } catch { }
        return { success: false };
    }
};
