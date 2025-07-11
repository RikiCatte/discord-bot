const BotConfig = require("../../schemas/BotConfig");
require("colors");

module.exports = async (client) => {
    const config = await BotConfig.findOne({ GuildID: client.guilds.cache.first().id });
    if (!config || !config.services?.dinamic_activities?.enabled) return;

    const activities = config.services.dinamic_activities.activities || [
        'Watching the stars',
        'Listening to the wind',
        'Coding in the dark',
        'Playing with shadows',
        'Exploring the unknown',
        'Ping'
    ];

    activities.push(`\🧑‍💻\ Developed by RikiCatte`);
    activities.push(`\💻\ https://github.com/RikiCatte`);

    const status = config.services.dinamic_activities.status || 'dnd';
    const interval = config.services.dinamic_activities.interval || 10000;

    console.log(`[LOADED BOT ACTIVITIES] Dynamic activities enabled: ${activities.join(', ')}`.yellow);

    setInterval(() => {
        let activity = activities[Math.floor(Math.random() * activities.length)];

        if (activity === 'Ping') activity = `\📶\ Ping: ${client.ws.ping}ms`;
        if (activity === 'Server Count') activity = `\🌐\ Servers: ${client.guilds.cache.size}`;
        if (activity === 'User Count') activity = `👥 Watching ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)} users`;
        if (activity === 'Current Time') activity = `\🕒\ ${new Date().toLocaleTimeString()}`;
        if (activity === 'Discord Version') activity = `\🔗\ Discord.js: ${require('discord.js').version}`;

        client.user.setPresence({
            activities: [{ name: activity }],
            status: status,
        });
    }, interval);
}