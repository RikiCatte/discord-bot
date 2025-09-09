const BotConfig = require("../../schemas/BotConfig.js");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig.js");

/**
 * Remove expired games from the database of a specific guild
 * @returns {Promise<number>} - The number of games removed
 */
module.exports = async function removeExpiredGames(guildId) {
    const config = await BotConfig.findOne({ GuildID: guildId });
    const serviceConfig = config?.services?.freegames;

    if (!config || !serviceConfig.enabled || serviceConfig.Games) return;

    const now = new Date();
    const originalLength = serviceConfig.Games.length;

    serviceConfig.Games = serviceConfig.Games.filter(game => new Date(game.EndDate) > now);

    await updateServiceConfig(config, "freegames", { Games: serviceConfig.Games });

    return originalLength - serviceConfig.Games.length;
}