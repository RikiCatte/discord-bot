const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, TextInputStyle } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");
const createSelectMenu = require("../../utils/BotConfig/createSelectMenu");
const handleSelectMenuInteraction = require("../../utils/BotConfig/handleSelectMenuInteraction");
const createModal = require("../../utils/BotConfig/createModal");
const replySuccessfullyDisabledService = require("../../utils/BotConfig/replySuccessfullyDisabledService");
const successfullyReEnabledService = require("../../utils/BotConfig/replySuccesfullyRe-EnabledService");

const antilinkPermissionOptions = [
    { label: "Manage Channels", value: "ManageChannels" },
    { label: "Manage Server", value: "ManageGuild" },
    { label: "Embed Links", value: "EmbedLinks" },
    { label: "Attach Files", value: "AttachFiles" },
    { label: "ManageMessages", value: "ManageMessages" },
    { label: "Administrator", value: "Administrator" }
];

const nitroboostFields = [
    { customId: "channelID", label: "The channel ID", style: TextInputStyle.Short, placeholder: "Input the channel ID" },
    { customId: "embedColor", label: "Embed Color (HEX)", style: TextInputStyle.Short, placeholder: "#f47fff" },
    { customId: "embedTitle", label: "Embed Title", style: TextInputStyle.Short, placeholder: "New Booster 🎉" },
    { customId: "embedMessage", label: "Embed Message", style: TextInputStyle.Paragraph, placeholder: "Thank you for boosting the server! Use [m] to ping the booster." },
    { customId: "boostMessage", label: "Boost Message", style: TextInputStyle.Paragraph, placeholder: "Thanks for boosting [m]! Use [m] to ping the booster." }
];

const captchaFields = [
    { customId: "roleID", label: "Role ID to assign after captcha verification", style: TextInputStyle.Short, placeholder: "Input the role ID" },
    { customId: "logChannelID", label: "Log Channel ID", style: TextInputStyle.Short, placeholder: "Input the log channel ID" },
    { customId: "reJoinLimit", label: "Rejoin Limit", style: TextInputStyle.Short, placeholder: "Number of rejoin attempts before kick", value: "3" },
    { customId: "expireInMS", label: "Captcha Expiration Time (ms)", style: TextInputStyle.Short, placeholder: "600000 (10 minutes)", value: "600000" },
    { customId: "captchaText", label: "Captcha Text (type Random for random)", style: TextInputStyle.Paragraph, placeholder: "Type the captcha text here" }
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

        switch (service) {
            case "antilink":
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

                    const row = createSelectMenu({
                        customId: "antilink-permission",
                        placeholder: "Choose the permission to bypass the AntiLink system",
                        options: antilinkPermissionOptions
                    });

                    await interaction.reply({
                        content: `**[ENABLE]** Select a permission to bypass AntiLink system:`,
                        components: [row],
                        flags: MessageFlags.Ephemeral
                    });

                    const { success, select } = await handleSelectMenuInteraction(interaction, "antilink-permission");
                    if (!success) return;

                    await updateServiceConfig(config, service, { enabled: true, Permissions: select.values[0] });
                    await select.update({ content: `\`✅\` Permission set to \`${select.values[0]}\``, components: [] });
                    return;
                } else if (action === "edit") {
                    if (config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "enabled");
                        return;
                    }

                    const row = createSelectMenu({
                        customId: "antilink-permission",
                        placeholder: "Choose the new permission to bypass the AntiLink system",
                        options: antilinkPermissionOptions
                    });

                    await interaction.reply({
                        content: `**[EDIT]** Choose the new permission to bypass the AntiLink system:`,
                        components: [row],
                        flags: MessageFlags.Ephemeral
                    });

                    const { success, select } = await handleSelectMenuInteraction(interaction, "antilink-permission");
                    if (!success) return;

                    await updateServiceConfig(config, service, { enabled: true, Permissions: select.values[0] });
                    await select.update({ content: `\`✅\` Permission set to \`${select.values[0]}\``, components: [] });
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
            case "nitroboost":
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
                        customId: "nitroboost-setup",
                        title: "Setup Nitro Boost",
                        fields: nitroboostFields
                    }, 300_000); // 5 minutes timeout

                    if (!success) return;

                    await updateServiceConfig(config, service, {
                        enabled: true,
                        channelID: values.channelID,
                        embedColor: values.embedColor,
                        embedTitle: values.embedTitle,
                        embedMessage: values.embedMessage,
                        boostMessage: values.boostMessage
                    });

                    await modalInteraction.reply({ content: `\`✅\` ${service} service setup in <#${values.channelID}>`, flags: MessageFlags.Ephemeral });
                    return;
                } else if (action === "edit") {
                    const { success, values, modalInteraction } = await createModal(interaction, {
                        customId: "nitroboost-setup",
                        title: "Setup Nitro Boost",
                        fields: nitroboostFields
                    }, 300_000);

                    if (!success) return;

                    await updateServiceConfig(config, service, {
                        enabled: true,
                        channelID: values.channelID,
                        embedColor: values.embedColor,
                        embedTitle: values.embedTitle,
                        embedMessage: values.embedMessage,
                        boostMessage: values.boostMessage
                    });

                    await modalInteraction.reply({ content: `\`✅\` ${service} service setup in <#${values.channelID}>`, flags: MessageFlags.Ephemeral });
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
            case "captcha":
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
                        customId: "captcha-setup",
                        title: "Setup Captcha",
                        fields: captchaFields
                    }, 300_000); // 5 minutes timeout

                    if (!success) return;

                    await updateServiceConfig(config, service, {
                        enabled: true,
                        RoleID: values.roleID,
                        LogChannelID: values.logChannelID,
                        ReJoinLimit: parseInt(values.reJoinLimit),
                        ExpireInMS: parseInt(values.expireInMS),
                        Captcha: values.captchaText
                    });

                    await modalInteraction.reply({ content: `\`✅\` ${service} service setup with role <@&${values.roleID}>, captcha logs will be sent in <#${values.logChannelID}>`, flags: MessageFlags.Ephemeral });
                    return;
                } else if (action === "edit") {
                    const { success, values, modalInteraction } = await createModal(interaction, {
                        customId: "captcha-setup",
                        title: "Setup Captcha",
                        fields: captchaFields
                    }, 300_000); // 5 minutes timeout

                    if (!success) return;

                    await updateServiceConfig(config, service, {
                        enabled: true,
                        RoleID: values.roleID,
                        LogChannelID: values.logChannelID,
                        ReJoinLimit: parseInt(values.reJoinLimit),
                        ExpireInMS: parseInt(values.expireInMS),
                        Captcha: values.captchaText
                    });

                    await modalInteraction.reply({ content: `\`✅\` ${service} service setup with role <@&${values.roleID}>, captcha logs will be sent in <#${values.logChannelID}>`, flags: MessageFlags.Ephemeral });
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
                await interaction.reply({ content: "\`⚠️\` Unrecognised service.", flags: MessageFlags.Ephemeral });
        }
    }
}