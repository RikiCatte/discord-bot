const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");

module.exports = async function deleteExpiredGiveaways(client, config) {
    try {
        const serviceConfig = config?.services?.giveaway;
        if (!config || !serviceConfig?.enabled) return;

        const giveaways = serviceConfig?.giveaways || [];

        const activeGiveaways = giveaways.filter(g => !g.Ended);
        if (activeGiveaways.length !== giveaways.length) await updateServiceConfig(config, "giveaway", { giveaways: activeGiveaways });
    } catch (error) {
        console.log(error);
    }
}