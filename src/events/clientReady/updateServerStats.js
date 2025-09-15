const BotConfig = require("../../schemas/BotConfig");

module.exports = async (client) => {
    async function updateStats() {
        for (const [guildId, guild] of client.guilds.cache) {
            const config = await BotConfig.findOne({ GuildID: guildId });
            const statsConfig = config?.services?.serverstats;

            if (!statsConfig || !statsConfig.enabled || !Array.isArray(statsConfig.channels)) continue;

            for (const stat of statsConfig.channels) {
                const channel = client.channels.cache.get(stat.ChannelID);
                if (!channel) continue;

                let name = stat.Label;
                switch (stat.Type) {
                    case "total":
                        name = `${stat.Label} ${guild.memberCount}`;
                        break;
                    case "members":
                        name = `${stat.Label} ${guild.members.cache.filter(m => !m.user.bot).size}`;
                        break;
                    case "bots":
                        name = `${stat.Label} ${guild.members.cache.filter(m => m.user.bot).size}`;
                        break;
                    case "role":
                        if (stat.RoleID) {
                            name = `${stat.Label} ${guild.members.cache.filter(m => m.roles.cache.has(stat.RoleID)).size}`;
                        }
                        break;
                    case "activity":
                        name = stat.Label
                            .replace("{online}", guild.members.cache.filter(m => m.presence?.status === "online").size)
                            .replace("{dnd}", guild.members.cache.filter(m => m.presence?.status === "dnd").size)
                            .replace("{idle}", guild.members.cache.filter(m => m.presence?.status === "idle").size)
                            .replace("{offline}", guild.members.cache.filter(m => m.presence?.status === "offline" || !m.presence).size);
                        break;
                    default:
                        continue;
                }

                try {
                    await channel.setName(name);
                } catch (err) {
                    console.error(`Failed to update channel ${stat.ChannelID} in guild ${guildId}:`, err);
                }
            }
        }
    }

    await updateStats();

    setInterval(updateStats, 5 * 60 * 1000);
};