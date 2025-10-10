const saveSentGame = require("./saveSentGame.js");
const removeExpiredGames = require("./removeExpiredGames.js");
const getFreeGames = require("./getFreeGames.js");
const BotConfig = require("../../schemas/BotConfig.js");

/**
 * Returns the list of free games available on configured sources
 * @param {Client} client 
 */
module.exports = async function pushNewGames(client) {
    const configs = await BotConfig.find({ "services.freegames.enabled": true });
    if (configs.length === 0) return [];

    const allGames = await getFreeGames(); // Get all free games from all sources
    const sentGames = [];

    for (const config of configs) {
        const guild = client.guilds.cache.get(config.GuildID);
        if (!guild) continue;

        const serviceConfig = config.services.freegames;
        if (!serviceConfig?.enabled) continue;

        await removeExpiredGames(config); // Remove expired games from the database

        // Pre-filter games not yet sent for this config
        const alreadySentIDs = new Set(serviceConfig.Games.map(g => g.ID));
        for (const game of allGames) {
            const raw = `${game.title}|${game.url}|${game.endDate}`;
            const gameID = require("crypto").createHash("sha256").update(raw).digest("hex");
            if (alreadySentIDs.has(gameID)) continue; // Already sent

            // Save only if not already sent
            const saved = await saveSentGame(config, {
                title: game.title,
                description: game.description,
                url: game.url,
                source: game.source || "Unknown",
                endDate: game.endDate,
                image: game.image || null
            });
            if (saved) sentGames.push(game);
        }
    }

    return sentGames;
}