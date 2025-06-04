const saveSentGame = require("./saveSentGame.js");
const removeExpiredGames = require("./removeExpiredGames.js");
const getFreeGames = require("./getFreeGames.js");

/**
 * Returns the list of free games available on configured sources
 * @param {Client} client 
 */
module.exports = async function pushNewGames(client) {
    await removeExpiredGames(); // Remove expired games from the database

    const allGames = await getFreeGames(); // Get all free games from all sources

    // Filter games that have not been sent yet and save them in the database
    const newGames = [];
    for (const game of allGames) {
        const saved = await saveSentGame({
            title: game.title,
            description: game.description,
            url: game.url,
            source: game.source || "Unknown",
            endDate: game.endDate,
            image: game.image || null
        });

        if (saved) newGames.push(game); // Save the game in the list of new games
    }

    return newGames;
}