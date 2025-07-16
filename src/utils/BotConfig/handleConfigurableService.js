const { MessageFlags } = require("discord.js");
const createModal = require("./createModal");
const createSelectMenu = require("./createSelectMenu");
const handleSelectMenuInteraction = require("./handleSelectMenuInteraction");
const updateServiceConfig = require("./updateServiceConfig");
const replyServiceAlreadyEnabledOrDisabled = require("./replyServiceAlreadyEnabledOrDisabled");
const replyServiceNotEnabled = require("./replyServiceNotEnabled");
const successfullyReEnabledService = require("./replySuccesfullyRe-EnabledService");
const replySuccessfullyDisabledService = require("./replySuccessfullyDisabledService");

module.exports = async function handleConfigurableService({
    interaction, config, service, action, updateFields, replyStrings, selectMenu, modal
}) {
    if (action === "disable") {
        if (!config.services[service]?.enabled) {
            await replyServiceAlreadyEnabledOrDisabled(interaction, service, "disabled");
            return;
        }
        await updateServiceConfig(config, service, { enabled: false });
        await replySuccessfullyDisabledService(interaction, service);
        return;
    }

    // Handling ENABLE/EDIT (unified logic for both actions)
    const isEnable = action === "enable";
    const isEdit = action === "edit";

    if (isEnable && config.services[service]?.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, service, "enabled");
    if (isEdit && !config.services[service]?.enabled) return await replyServiceNotEnabled(interaction, service);

    if (isEnable && config.services[service]) {
        await updateServiceConfig(config, service, { enabled: true });
        return await successfullyReEnabledService(interaction, service);
    }

    // If selectMenu is present, handle the menu logic
    if (selectMenu) {
        const row = createSelectMenu(selectMenu);
        await interaction.reply({
            content: selectMenu.content,
            components: [row],
            flags: MessageFlags.Ephemeral
        });

        const { success, select } = await handleSelectMenuInteraction(interaction, selectMenu.customId);
        if (!success) return;

        await updateServiceConfig(config, service, updateFields(select.values[0], isEnable));
        await select.update({ content: isEnable ? replyStrings.setupSuccess(select.values[0]) : replyStrings.editSuccess(select.values[0]), components: [] });
    }

    if (modal) {
        // Otherwise, handle the classic modal
        const { success, values, modalInteraction } = await createModal(interaction, modal, 300_000);
        if (!success) return;
        await updateServiceConfig(config, service, updateFields(values, isEnable));
        await modalInteraction.reply({
            content: isEnable ? replyStrings.setupSuccess(values) : replyStrings.editSuccess(values),
            flags: MessageFlags.Ephemeral
        });
    }
}
