const crypto = require("crypto");
const BotConfig = require("../../schemas/BotConfig.js");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig.js");

/**
 * Generate a unique ID for a game
 * @param {Object} game 
 */
function generateGameID(game) {
    const raw = `${game.title}|${game.url}|${game.endDate}`;
    return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Save a game in the database for a specific guild (to avoid sending it again)
 * @param {string} guildId
 * @param {Object} game
 * @returns {Promise<boolean>} - True if the game has been saved successfully, false if the game is already stored
 */
module.exports = async function saveSentGame(guildId, game) {
    const config = await BotConfig.findOne({ GuildID: guildId });
    const serviceConfig = config?.services?.freegames;
    if (!config || !serviceConfig?.enabled) return false;

    const gameID = generateGameID(game);

    const existingGame = serviceConfig.Games.find(g => g.ID === gameID);

    if (existingGame) return false; // Game already stored

    try {
        serviceConfig.Games.push({
            ID: gameID,
            Title: game.title,
            Description: game.description,
            Url: game.url,
            Source: game.source || "Unknown",
            EndDate: game.endDate,
            Image: game.image || null
        });

        await updateServiceConfig(config, "freegames", { Games: serviceConfig.Games });
        return true;
    } catch (error) {
        console.error("ERROR [saveSentGame.js]: ", error);
        return false;
    }
}