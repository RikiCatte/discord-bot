const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, TextInputStyle } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const { handleConfigurableService, promptConfigType } = require("../../utils/BotConfig");

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
        if (!config) {
            // Create an object with all modularized services disabled by default
            const defaultServices = {};
            for (const svcName of Object.keys(serviceConfigs)) {
                defaultServices[svcName] = { enabled: false };
            }
            config = new BotConfig({ GuildID: guild.id, services: defaultServices });
        }

        const svc = serviceConfigs[service];

        let configType = null;
        let selectInteraction = null;
        // If the service has multiple configuration types, prompt the user to select one
        if (svc.configTypes && svc.configTypes.length > 1) {
            const result = await promptConfigType(interaction, service, svc.configTypes);
            configType = result.configType;
            selectInteraction = result.selectInteraction;
        }

        // Management of modularized services
        if (serviceConfigs[service]) {
            await handleConfigurableService({
                interaction: selectInteraction || interaction,
                config,
                service,
                action,
                ...(configType && { configType }),
                ...(svc.getSelectMenu && { selectMenu: svc.getSelectMenu(action) }),
                ...(svc.getModal && { modal: svc.getModal(action, configType) }),
                ...(svc.fields && { fields: svc.fields }),
                updateFields: svc.updateFields,
                replyStrings: svc.replyStrings,
                ...(svc.silentReEnable && { silentReEnable: svc.silentReEnable }),
                svc
            });
            return;
        }

        // Management of non-modularized yet/legacy services
        switch (service) {
            // Management of non-modularized services
            default:
                await interaction.reply({ content: `\`⚠️\` service ${service} is not handled.`, flags: MessageFlags.Ephemeral });
        }
    }
}