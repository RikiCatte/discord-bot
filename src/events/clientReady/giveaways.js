const BotConfig = require("../../schemas/BotConfig.js");
const checkGiveaways = require("../../utils/giveaways/checkGiveaways.js");
const deleteExpiredGiveaways = require("../../utils/giveaways/deleteExpiredGiveaways.js");

module.exports = async (client) => {
    const configs = await BotConfig.find({ "services.giveaway.enabled": true });
    if (configs.length === 0) return;

    for (const config of configs) {
        const guild = client.guilds.cache.get(config.GuildID);
        if (!guild || !config.services.giveaway?.enabled) continue;

        setInterval(async () => {
            await checkGiveaways(client, config);
            await deleteExpiredGiveaways(client, config);
        }, 120_000); // The bot will check every 2 minutes for ending giveaways and expired giveaways ready to be deleted.
    }
};