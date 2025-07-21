const checkGiveaways = require("../../utils/giveaways/checkGiveaways.js");
const deleteExpiredGiveaways = require("../../utils/giveaways/deleteExpiredGiveaways.js");

module.exports = (client) => {
    setInterval(async () => {
        await checkGiveaways(client);
        await deleteExpiredGiveaways();
    }, 120_000); // The bot will check every 2 minutes for ending giveaways and expired giveaways ready to be deleted.
};