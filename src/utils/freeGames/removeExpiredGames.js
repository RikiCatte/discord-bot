const gameModel = require("../../schemas/sentGame.js");

/**
 * Remove expired games from the database
 * @returns {Promise<number>} - The number of games removed
 */
module.exports = async function removeExpiredGames() {
    const expiredGames = await gameModel.deleteMany({ endDate: { $lt: new Date().toISOString() } });

    return expiredGames.deletedCount;
}