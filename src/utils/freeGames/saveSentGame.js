const gameModel = require("../../schemas/sentGame.js");

/**
 * Save a game in the database that has been sent to the server channel (to avoid sending it again)
 * @param {Object} game
 * @returns {Promise<boolean>} - True if the game has been saved successfully, false if the game is already stored in the database (and therefore has already been sent)
 */
module.exports = async function saveSentGame(game) {
    const existingGame = await gameModel.findOne({
        title: game.title,
        url: game.url,
        source: game.source,
        endDate: game.endDate
    });

    if (existingGame) return false; // Game already stored in the database

    let status = false;
    try {
        await gameModel.create(game);
        status = true;
    } catch (error) {
        console.error("ERROR [saveSentGame.js]: ", error);
        return status;
    }
    finally {
        return status;
    }
}