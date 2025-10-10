const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig.js");

/**
 * Remove expired games from the database of a specific guild
 * @returns {Promise<number>} - The number of games removed
 */
module.exports = async function removeExpiredGames(config = null) {
    if (!config) return 0;

    const now = new Date();
    const serviceConfig = config.services.freegames;
    const originalLength = serviceConfig.Games.length;

    serviceConfig.Games = serviceConfig.Games.filter(game => new Date(game.EndDate) > now);

    await updateServiceConfig(config, "freegames", { Games: serviceConfig.Games });

    return originalLength - serviceConfig.Games.length;
}