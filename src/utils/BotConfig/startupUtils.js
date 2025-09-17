const BotConfig = require('../../schemas/BotConfig.js');

function getDefaultServicesFromSchema() {
    const servicesObj = BotConfig.schema.obj.services;
    const defaultServices = {};

    for (const [serviceName, serviceFields] of Object.entries(servicesObj)) {
        const defaults = {};
        for (const [fieldName, fieldSchema] of Object.entries(serviceFields)) {
            if (typeof fieldSchema === "object" && fieldSchema.default !== undefined) {
                defaults[fieldName] = typeof fieldSchema.default === "function"
                    ? fieldSchema.default()
                    : fieldSchema.default;
            } else if (typeof fieldSchema === "object" && fieldSchema.type) {
                switch (fieldSchema.type.name) {
                    case "Boolean": defaults[fieldName] = false; break;
                    case "Number": defaults[fieldName] = 0; break;
                    case "String": defaults[fieldName] = ""; break;
                    default: defaults[fieldName] = null;
                }
            } else {
                defaults[fieldName] = "";
            }
        }
        defaultServices[serviceName] = defaults;
    }
    return defaultServices;
}

async function ensureAllServicesInConfig() {
    const defaultServices = getDefaultServicesFromSchema();
    const configs = await BotConfig.find({});
    if (configs.length === 0) {
        console.log("[CONFIG FIX] No config found in MongoDB. It will only be created when /bot-set-service is executed.");
        return;
    }
    let anyUpdated = false;
    for (const config of configs) {
        let updated = false;
        for (const [service, defaults] of Object.entries(defaultServices)) {
            if (!config.services[service]) {
                config.services[service] = { ...defaults };
                updated = true;
                console.log(`[DEBUG] Service "${service}" added to guild ${config.GuildID}`);
            } else {
                for (const [field, value] of Object.entries(defaults)) {
                    if (!(field in config.services[service])) {
                        config.services[service][field] = value;
                        updated = true;
                        console.log(`[DEBUG] Field "${field}" added to service "${service}" for guild ${config.GuildID}`);
                    }
                }
            }
        }
        if (updated) {
            await config.save();
            console.log(`[CONFIG FIX] Config of guild ${config.GuildID} updated with missing services/fields.`);
            anyUpdated = true;
        }
    }
    if (!anyUpdated) {
        console.log("[CONFIG FIX] All services and fields are already present in the config, no updates needed.");
    }
}

async function checkBotConfigOnStartup(client) {
    const guilds = client.guilds.cache.map(g => g.id);
    for (const guildId of guilds) {
        const config = await BotConfig.findOne({ GuildID: guildId });
        if (!config || !config.services || Object.keys(config.services).length === 0)
            console.log(`[ERROR] Missing or incomplete configuration for guild ${guildId}. The bot won't work until it's configured with /bot-setup.`.red);
    }
}

module.exports = {
    getDefaultServicesFromSchema,
    ensureAllServicesInConfig,
    checkBotConfigOnStartup,
};