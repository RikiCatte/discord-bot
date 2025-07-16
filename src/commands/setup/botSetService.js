const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, TextInputStyle } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const getTextChannelOptions = require("../../utils/getTextChannelOptions");
const {
    updateServiceConfig,
    replyServiceAlreadyEnabledOrDisabled,
    createSelectMenu,
    handleSelectMenuInteraction,
    createModal,
    replySuccessfullyDisabledService,
    successfullyReEnabledService,
    replyServiceNotEnabled,
    handleConfigurableService
} = require("../../utils/BotConfig");

const path = require("path");
const fs = require("fs");

const serviceConfigs = {};
const configsPath = path.join(__dirname, "../../utils/BotConfig/serviceConfigs");
fs.readdirSync(configsPath).forEach(file => {
    if (file.endsWith(".js")) {
        const config = require(path.join(configsPath, file));
        if (config.name) serviceConfigs[config.name] = config;
    }
});

const dinamicActivitiesFields = [
    { customId: "activities", label: "Activities (comma separated)", style: TextInputStyle.Paragraph, placeholder: "Ping, Server Count, User Count, Current Time, Discord Version" },
    { customId: "status", label: "Status", style: TextInputStyle.Short, placeholder: "online, idle, dnd, invisible", value: "dnd" },
    { customId: "interval", label: "Interval (ms)", style: TextInputStyle.Short, placeholder: "10000", value: "10000" }
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bot-set-service")
        .setDescription("Set up a bot service")
        .addStringOption(option =>
            option.setName("service")
                .setDescription("Select the service to set up")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName("action")
                .setDescription("What to do with the service")
                .addChoices(
                    { name: "Enable", value: "enable" },
                    { name: "Disable", value: "disable" },
                    { name: "Edit", value: "edit" }
                )
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],
    category: "setup",

    autocomplete: async (interaction) => {
        const allServices = Object.keys(BotConfig.schema.obj.services);
        const focusedValue = interaction.options.getFocused();
        const filtered = allServices.filter(s =>
            s.toLowerCase().includes(focusedValue.toLowerCase())
        );

        await interaction.respond(filtered.slice(0, 25).map(s => ({ name: s, value: s })));
    },

    run: async (client, interaction) => {
        const { guild, options } = interaction;
        const service = options.getString("service");
        const action = options.getString("action");

        let config = await BotConfig.findOne({ GuildID: guild.id });
        if (!config) config = new BotConfig({ GuildID: guild.id, services: {} });

        // Management of modularized services
        if (serviceConfigs[service]) {
            const svc = serviceConfigs[service];
            await handleConfigurableService({
                interaction,
                config,
                service,
                action,
                ...(svc.getSelectMenu && { selectMenu: svc.getSelectMenu(action) }),
                ...(svc.getModal && { modal: svc.getModal(action) }),
                ...(svc.fields && { fields: svc.fields }),
                updateFields: svc.updateFields,
                replyStrings: svc.replyStrings
            });
            return;
        }

        // Management of non-modularized yet/legacy services
        switch (service) {
            // TODO: modularize these services and then remove this switch-case if not needed
            case "ban":
                if (action === "enable") {
                    if (config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "enabled");
                        return;
                    }

                    if (config.services[service]) {
                        await updateServiceConfig(config, service, { enabled: true });
                        return await interaction.reply({ content: `\`✅\` ${service} service enabled.`, flags: MessageFlags.Ephemeral });
                    }
                }

                if (action === "edit") {
                    if (!config.services[service]?.enabled) return await replyServiceNotEnabled(interaction, service);

                    return await interaction.reply({
                        content:
                            `\`⚠️\` The \`${service}\` service is not editable through this command. If you want to disable it run \`/bot-set-service\` \`ban\` \`disable\`. 
                        If you want to manage bans please use \`/ban\` or \`/unban\` bot commands or use your Discord client.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (action === "disable") {
                    if (!config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "disabled");
                        return;
                    }

                    await updateServiceConfig(config, service, { enabled: false });
                    await replySuccessfullyDisabledService(interaction, service);
                    return;
                }
                break;
            case "dinamic_activities":
                if (action === "enable") {
                    if (config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "enabled");
                        return;
                    }

                    if (config.services[service]) {
                        await updateServiceConfig(config, service, { enabled: true });
                        await successfullyReEnabledService(interaction, service);
                        return;
                    }

                    const { success, values, modalInteraction } = await createModal(interaction, {
                        customId: "dinamic-activities-setup",
                        title: "Setup Dinamic Activities",
                        fields: dinamicActivitiesFields
                    }, 300_000);

                    if (!success) return;

                    await updateServiceConfig(config, service, {
                        enabled: true,
                        activities: values.activities.split(",").map(activity => activity.trim()),
                        status: values.status,
                        interval: parseInt(values.interval)
                    });

                    return await modalInteraction.reply({ content: `\`✅\` ${service} service setup with activities: \`${values.activities}\`, status: \`${values.status}\`, interval: \`${values.interval}\`ms. Please restart the bot to apply changes.`, flags: MessageFlags.Ephemeral });
                } else if (action === "edit") {
                    if (!config.services[service]?.enabled) return await replyServiceNotEnabled(interaction, service);

                    const { success, values, modalInteraction } = await createModal(interaction, {
                        customId: "dinamic-activities-edit",
                        title: "Edit Dinamic Activities",
                        fields: dinamicActivitiesFields
                    }, 300_000);

                    if (!success) return;

                    await updateServiceConfig(config, service, {
                        enabled: true,
                        activities: values.activities.split(",").map(activity => activity.trim()),
                        status: values.status,
                        interval: parseInt(values.interval)
                    });

                    return await modalInteraction.reply({ content: `\`✅\` ${service} service updated with activities: \`${values.activities}\`, status: \`${values.status}\`, interval: \`${values.interval}\`ms. Please restart the bot to apply changes.`, flags: MessageFlags.Ephemeral });
                } else if (action === "disable") {
                    if (!config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "disabled");
                        return;
                    }

                    await updateServiceConfig(config, service, { enabled: false });
                    await replySuccessfullyDisabledService(interaction, service);
                    return;
                }
                break;
            case "unban":
                if (action === "enable") {
                    if (config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "enabled");
                        return;
                    }

                    if (config.services[service]) {
                        await updateServiceConfig(config, service, { enabled: true });
                        return await interaction.reply({ content: `\`✅\` ${service} service enabled.`, flags: MessageFlags.Ephemeral });
                    }
                }

                if (action === "edit") {
                    if (!config.services[service]?.enabled) return await replyServiceNotEnabled(interaction, service);

                    return await interaction.reply({
                        content:
                            `\`⚠️\` The \`${service}\` service is not editable through this command. If you want to disable it run \`/bot-set-service\` \`unban\` \`disable\`. 
                        If you want to manage bans please use \`/ban\` or \`/unban\` bot commands or use your Discord client.`,
                        flags: MessageFlags.Ephemeral
                    });
                }

                if (action === "disable") {
                    if (!config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "disabled");
                        return;
                    }

                    await updateServiceConfig(config, service, { enabled: false });
                    await replySuccessfullyDisabledService(interaction, service);
                    return;
                }
                break;
            case "bugreport":
                if (action === "enable") {
                    if (config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "enabled");
                        return;
                    }

                    if (config.services[service]) {
                        await updateServiceConfig(config, service, { enabled: true });
                        await successfullyReEnabledService(interaction, service);
                        return;
                    }

                    const { success, values, modalInteraction } = await createModal(interaction, {
                        customId: "bugreport-channel-setup",
                        title: "Setup Bug Report Channel",
                        fields: [{ customId: "channelID", label: "The channel ID", style: TextInputStyle.Short, placeholder: "Input the channel ID" }]
                    }, 300_000);

                    if (!success) return;

                    await updateServiceConfig(config, service, { enabled: true, ReportChannelID: values.channelID });

                    await modalInteraction.reply({ content: `\`✅\` Bug reports will be sent to <#${values.channelID}>`, flags: MessageFlags.Ephemeral });
                    return;
                } else if (action === "edit") {
                    if (!config.services[service]?.enabled) return await replyServiceNotEnabled(interaction, service);

                    const { success, values, modalInteraction } = await createModal(interaction, {
                        customId: "bugreport-channel-edit",
                        title: "Edit Bug Report Channel",
                        fields: [{ customId: "channelID", label: "The new channel ID", style: TextInputStyle.Short, placeholder: "Input the new channel ID" }]
                    }, 300_000);

                    if (!success) return;

                    await updateServiceConfig(config, service, { enabled: true, ReportChannelID: values.channelID });

                    await modalInteraction.reply({ content: `\`✅\` Bug reports will now be sent to <#${values.channelID}>`, flags: MessageFlags.Ephemeral });
                    return;
                } else if (action === "disable") {
                    if (!config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "disabled");
                        return;
                    }

                    await updateServiceConfig(config, service, { enabled: false });
                    await replySuccessfullyDisabledService(interaction, service);
                    return;
                }
                break;
            default:
                await interaction.reply({ content: `\`⚠️\` service ${service} is not handled.`, flags: MessageFlags.Ephemeral });
        }
    }
}