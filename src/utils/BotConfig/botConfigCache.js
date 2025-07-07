const BotConfig = require("../../schemas/BotConfig");

class BotConfigCache {
    constructor() {
        this.cache = new Map();
        this.refreshInterval = 5 * 60 * 1000; // 5 minutes
        this.startAutoRefresh();
    }

    async getConfig(guildId) {
        let config = await BotConfig.findOne({ GuildID: guildId });
        if (!config) return null;
        this.cache.set(guildId, config);
        return config;
    }

    async refreshConfig(guildId) {
        const config = await BotConfig.findOne({ GuildID: guildId });
        if (config) this.cache.set(guildId, config);
    }

    startAutoRefresh() {
        setInterval(async () => {
            const allConfigs = await BotConfig.find();
            for (const config of allConfigs) {
                this.cache.set(config.GuildID, config);
            }
        }, this.refreshInterval);
    }
}

module.exports = new BotConfigCache();