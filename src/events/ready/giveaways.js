const BotConfig = require("../../schemas/BotConfig.js");
const checkGiveaways = require("../../utils/giveaways/checkGiveaways.js");
const deleteExpiredGiveaways = require("../../utils/giveaways/deleteExpiredGiveaways.js");

module.exports = async (client) => {
    const guilds = client.guilds.cache.map(g => g.id);

    for (const guildId of guilds) {
        const config = await BotConfig.findOne({ GuildID: guildId });
        if (!config || !config.services.giveaway?.enabled) continue;

        setInterval(async () => {
            await checkGiveaways(client);
            await deleteExpiredGiveaways();
        }, 120_000); // The bot will check every 2 minutes for ending giveaways and expired giveaways ready to be deleted.
    }
};