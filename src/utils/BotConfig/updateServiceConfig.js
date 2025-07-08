const BotConfig = require("../../schemas/BotConfig");
const botConfigCache = require("./botConfigCache");

module.exports = async function updateServiceConfig(config, service, updates) {
    await BotConfig.findOneAndUpdate(
        { GuildID: config.GuildID },
        { $set: Object.fromEntries(
            Object.entries(updates).map(([key, value]) => [`services.${service}.${key}`, value])
        ) },
        { upsert: true }
    );
    
    // Update the cache after modifying the config
    await botConfigCache.refreshConfig(config.GuildID);
}