const BotConfig = require("../../schemas/BotConfig");

module.exports = async function updateServiceConfig(configOrGuildId, service, updates) {
    const guildId = typeof configOrGuildId === "string" ? configOrGuildId : configOrGuildId.GuildID;

    if (!guildId) throw new Error("[updateServiceConfig.js] GuildID is required");

    await BotConfig.findOneAndUpdate(
        { GuildID: guildId },
        {
            $set: Object.fromEntries(
                Object.entries(updates).map(([key, value]) => [`services.${service}.${key}`, value])
            )
        },
        { upsert: true, new: true }
    );
}