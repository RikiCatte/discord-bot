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
    interaction, config, service, action, updateFields, replyStrings, selectMenu, modal, silentReEnable = false, configType, svc = null
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

        if (silentReEnable) return await interaction.reply({ content: replyStrings.setupSuccess(), flags: MessageFlags.Ephemeral });
        else return await successfullyReEnabledService(interaction, service);
    }

    if (action === "edit" && svc?.editNotSupported) return await interaction.reply({ content: `\`⚠️\` The \`${service}\` service does not support editing its configuration. You can only enable or disable it using the corresponding command.`, flags: MessageFlags.Ephemeral });

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
        let modalInteraction;
        try {
            const { success, values, modalInteraction: mi } = await createModal(interaction, modal, 300_000);
            modalInteraction = mi;
            if (!success) return;
            const updated = configType ? updateFields(configType, values, isEnable) : updateFields(values, isEnable);

            // DRY validation logic for input (not all services require this check)
            if (svc?.validateInput) {
                try {
                    await svc.validateInput(interaction, updated);
                } catch (err) {
                    await modalInteraction.reply({
                        content: err.message || "An error occurred while validating your input.",
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
            }

            await updateServiceConfig(config, service, updated);

            if (svc.getPreview && configType) {
                const preview = await svc.getPreview(configType, values, interaction.user);
                if (preview) {
                    // If the preview is an attachment, send it as a file
                    if (preview.files) {
                        await modalInteraction.reply({
                            content: `${isEnable ? replyStrings.setupSuccess(updated) : replyStrings.editSuccess(updated)}\n${preview.content || ""}`,
                            files: preview.files,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }

                    // If the preview is an embed or an array of embeds, send it as an embed
                    if (Array.isArray(preview) || (preview && preview.data)) {
                        await modalInteraction.reply({
                            content: isEnable ? replyStrings.setupSuccess(updated) : replyStrings.editSuccess(updated),
                            embeds: Array.isArray(preview) ? preview : [preview],
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    } else {
                        // If the preview is a string, send it as a content message
                        await modalInteraction.reply({
                            content: `${isEnable ? replyStrings.setupSuccess(updated) : replyStrings.editSuccess(updated)}\n${preview}`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }
                }
            }

            // If no preview is provided, just send a success message
            await modalInteraction.reply({
                content: isEnable ? replyStrings.setupSuccess(updated) : replyStrings.editSuccess(updated),
                flags: MessageFlags.Ephemeral
            });
        } catch (err) {
            const replyTarget = modalInteraction || interaction;
            await replyTarget.reply({
                content: err.message || "An error occurred while updating the configuration.",
                flags: MessageFlags.Ephemeral
            });
            return;
        }
    }
}
