const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const botConfigCache = require("../../utils/BotConfig/botConfigCache");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");
const createSelectMenu = require("../../utils/BotConfig/createSelectMenu");
const handleSelectMenuInteraction = require("../../utils/BotConfig/handleSelectMenuInteraction");
const createModal = require("../../utils/BotConfig/createModal");
const replySuccessfullyDisabledService = require("../../utils/BotConfig/replySuccessfullyDisabledService");

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
                if (action === "enable" || action === "edit") {
                    if (action === "enable" && config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "enabled");
                        return;
                    }

                    const permissionOptions = [
                        { label: "Manage Channels", value: "ManageChannels" },
                        { label: "Manage Server", value: "ManageGuild" },
                        { label: "Embed Links", value: "EmbedLinks" },
                        { label: "Attach Files", value: "AttachFiles" },
                        { label: "ManageMessages", value: "ManageMessages" },
                        { label: "Administrator", value: "Administrator" }
                    ];

                    const row = createSelectMenu({ customId: "antilink-permission", placeholder: "Choose the permission to bypass the AntiLink system", options: permissionOptions });

                    await interaction.reply({
                        content: action === "enable"
                            ? `**[ENABLE]** Select a permission to bypass the AntiLink system:`
                            : `**[EDIT]** Choose the new permission to bypass the AntiLink system:`,
                        components: [row],
                        flags: MessageFlags.Ephemeral
                    });

                    const { success, select } = await handleSelectMenuInteraction(interaction, "antilink-permission");
                    if (!success) return;

                    await updateServiceConfig(config, service, { enabled: true, Permissions: select.values[0] });
                    botConfigCache.refreshConfig(guild.id);
                    await select.update({ content: `\`✅\` Permission set to \`${select.values[0]}\``, components: [] });
                    return;
                } else if (action === "disable") {
                    if (!config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "disabled");
                        return;
                    }
                    await updateServiceConfig(config, service, { enabled: false });
                    botConfigCache.refreshConfig(guild.id);
                    await replySuccessfullyDisabledService(interaction, service);
                    return;
                }
                break;
            case "nitroboost":
                if (action === "enable" || action === "edit") {
                    if (action === "enable" && config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "enabled");
                        return;
                    }

                    const fields = [
                        { customId: "channelID", label: "The channel ID", style: TextInputStyle.Short, placeholder: "Input the channel ID" },
                        { customId: "embedColor", label: "Embed Color (HEX)", style: TextInputStyle.Short, placeholder: "#f47fff" },
                        { customId: "embedTitle", label: "Embed Title", style: TextInputStyle.Short, placeholder: "New Booster 🎉" },
                        { customId: "embedMessage", label: "Embed Message", style: TextInputStyle.Paragraph, placeholder: "Thank you for boosting the server! Use [m] to ping the booster." },
                        { customId: "boostMessage", label: "Boost Message", style: TextInputStyle.Paragraph, placeholder: "Thanks for boosting [m]! Use [m] to ping the booster." }
                    ];

                    const { success, values, modalInteraction } = await createModal(interaction, {
                        customId: "nitroboost-setup",
                        title: "Setup Nitro Boost",
                        fields
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

                    botConfigCache.refreshConfig(guild.id);

                    await modalInteraction.reply({ content: `\`✅\` Nitro Boost service setup in ${values.channelID}`, flags: MessageFlags.Ephemeral });
                    return;
                } else if (action === "disable") {
                    if (!config.services[service]?.enabled) {
                        await replyServiceAlreadyEnabledOrDisabled(interaction, service, "disabled");
                        return;
                    }

                    await updateServiceConfig(config, service, { enabled: false });
                    botConfigCache.refreshConfig(guild.id);

                    await replySuccessfullyDisabledService(interaction, service);
                    return;
                }
                // ...altre azioni...
                break;
            // altri servizi...
            default:
                await interaction.reply({ content: "\`⚠️\` Unrecognised service.", flags: MessageFlags.Ephemeral });
        }

        botConfigCache.refreshConfig(guild.id);
        await interaction.reply({ content: `\`✅\` Service \`${service}\` updated with action \`${action}\`.`, flags: MessageFlags.Ephemeral });
    }
}