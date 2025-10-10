const { EmbedBuilder, ChannelType } = require("discord.js");
const schedule = require('node-schedule');
const pushNewGames = require("../../utils/freeGames/pushNewGames.js");
const BotConfig = require("../../schemas/BotConfig.js");

/**
 * Send a daily notification with the list of free games available
 */
module.exports = async function dailyGameNotification(client) {
    // Schedule the job to run every day at 9:00 AM
    schedule.scheduleJob('0 9 * * *', async () => {
        try {
            // Fetch new games and process them
            const allGames = await pushNewGames(client);

            const configs = await BotConfig.find({ "services.freegames.enabled": true });
            if (allGames.length === 0 || configs.length === 0) return;

            // Loop through each guild configuration
            for (const config of configs) {
                const guild = client.guilds.cache.get(config.GuildID);
                if (!guild) continue;

                const serviceConfig = config.services.freegames;
                const channelId = serviceConfig.ChannelID;
                if (!channelId) continue;

                const channel = guild.channels.cache.get(channelId);
                if (!channel || channel.type !== ChannelType.GuildText) continue; // Only text channels

                // Parallelize sending embeds for all games
                await Promise.all(allGames.map(async (game) => {
                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `${client.user.username}`, iconURL: client.user.displayAvatarURL() })
                        .setTitle(`${game.title} is now free!`)
                        .setDescription(game.description || "No description available")
                        .addFields(
                            { name: "Available for free since", value: `<t:${Math.floor(new Date(game.startDate).getTime() / 1000)}:R>`, inline: true },
                            { name: "Available for free until", value: game.endDate ? `<t:${Math.floor(new Date(game.endDate).getTime() / 1000)}:R>` : 'No end date', inline: true },
                            { name: "Source", value: game.source || "Unknown", inline: true },
                            { name: "URL", value: `[Click here](${game.url})`, inline: true }
                        )
                        .setColor("Green")
                        .setTimestamp();

                    if (game.image) embed.setImage(game.image);

                    await channel.send({ embeds: [embed] });
                }));

                // Delete messages of expired games for that guild (limited to max 20 deletes per cycle to avoid Discord rate limits)
                await deleteExpiredGameMessages(channel, 20);
            }
        } catch (error) {
            console.error(`ERROR [dailyGameNotification.js]: `, error);
        }
    });
}

/**
 * Delete messages of expired games, (also uncached messages)
 */
async function deleteExpiredGameMessages(channel) {
    let lastMessageId;
    const now = new Date();
    let deletedCount = 0;

    while (true) {
        const options = { limit: 100 };
        if (lastMessageId) options.before = lastMessageId;

        const messages = await channel.messages.fetch(options);
        if (messages.size === 0) break;

        for (const message of messages.values()) {
            if (message.embeds.length > 0) {
                const embed = message.embeds[0];
                const endDateField = embed.fields.find(field => field.name === "Available for free until");

                if (endDateField && endDateField.value !== 'No end date') {
                    const endDateTimestamp = parseInt(endDateField.value.match(/<t:(\d+):R>/)[1]) * 1000;
                    const endDate = new Date(endDateTimestamp);

                    if (endDate < now) {
                        await message.delete();
                        deletedCount++;
                        if (deletedCount >= (arguments[1] || 20)) return;
                    }
                }
            }
        }

        lastMessageId = messages.last().id;
    }
}