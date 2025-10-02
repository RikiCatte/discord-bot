const BotConfig = require("../../schemas/BotConfig");
require("colors");
const { useQueue } = require("discord-player");

module.exports = async (client) => {
    const configs = await BotConfig.find({ "services.dinamic_activities.enabled": true });
    if (configs.length === 0) return;

    const customActivities = [
        '🧑‍💻 Developed by RikiCatte',
        '💻 https://github.com/RikiCatte'
    ];

    for (const config of configs) {
        const guild = client.guilds.cache.get(config.GuildID);
        if (!guild) continue;

        const serviceConfig = config.services.dinamic_activities;
        if (!serviceConfig?.enabled) continue;

        const activities = (serviceConfig.activities || [
            'Watching the stars',
            'Listening to the wind',
            'Coding in the dark',
            'Playing with shadows',
            'Exploring the unknown',
            'Ping'
        ]);

        for (const custom of customActivities) {
            if (!activities.includes(custom)) activities.push(custom);
        }

        const status = serviceConfig.status || 'dnd';
        const interval = serviceConfig.interval || 10000;

        console.log(`[LOADED BOT ACTIVITIES] Dynamic activities enabled: ${activities.join(', ')}`.yellow);
        setInterval(() => {
            if (!config.services.music?.enabled) return;
            
            const queue = useQueue(guild.id);
            if (queue && queue.currentTrack && !queue.node.isPaused()) return;

            let activity = activities[Math.floor(Math.random() * activities.length)];

            if (activity === 'Ping') activity = `\📶\ Ping: ${client.ws.ping}ms`;
            if (activity === 'Server Count') activity = `\🌐\ Servers: ${client.guilds.cache.size}`;
            if (activity === 'User Count') activity = `\👥\ Watching ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} users`;
            if (activity === 'Current Time') activity = `\🕒\ ${new Date().toLocaleTimeString()}`;
            if (activity === 'Discord Version') activity = `\🔗\ Discord.js: ${require('discord.js').version}`;

            client.user.setPresence({
                activities: [{ name: activity }],
                status: status,
            });
        }, interval);
    }
}