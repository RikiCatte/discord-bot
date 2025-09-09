const saveSentGame = require("./saveSentGame.js");
const removeExpiredGames = require("./removeExpiredGames.js");
const getFreeGames = require("./getFreeGames.js");
const BotConfig = require("../../schemas/BotConfig.js");

/**
 * Returns the list of free games available on configured sources
 * @param {Client} client 
 */
module.exports = async function pushNewGames(client) {
    const allGames = await getFreeGames(); // Get all free games from all sources
    const sentGames = [];

    for (const [guildId] of client.guilds.cache) {
        const config = await BotConfig.findOne({ GuildID: guildId });
        const serviceConfig = config?.services?.freegames;
        if (!config || !serviceConfig?.enabled) continue;

        await removeExpiredGames(guildId); // Remove expired games from the database

        // Filter games that have not been sent yet and save them in the database
        for (const game of allGames) {
            const saved = await saveSentGame(guildId, {
                title: game.title,
                description: game.description,
                url: game.url,
                source: game.source || "Unknown",
                endDate: game.endDate,
                image: game.image || null
            });

            if (saved) sentGames.push(game); // Save the game in the list of new games
        }
    }

    return sentGames;
}