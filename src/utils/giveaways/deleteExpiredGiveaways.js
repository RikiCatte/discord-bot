const BotConfig = require("../../schemas/BotConfig");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");

module.exports = async (client) => {
    try {
        const guilds = client.guilds.cache.map(g => g.id);

        for (const guildId of guilds) {
            const config = await BotConfig.findOne({ GuildID: guildId });
            const serviceConfig = config?.services?.giveaway;

            if (!config || !serviceConfig?.enabled) continue;

            const giveaways = serviceConfig?.giveaways || [];

            giveaways.forEach(async (giveaway) => {
                if (giveaway.Ended)
                    return await updateServiceConfig(config, "giveaway", { giveaways: serviceConfig.giveaways.filter(g => g.MessageID !== giveaway.MessageID) });
            });
        }
    } catch (error) {
        console.log(error);
    }
}