const { EmbedBuilder } = require("discord.js");

const schedule = require('node-schedule');
const pushNewGames = require("../../utils/freeGames/pushNewGames.js");
const msgConfig = require("../../messageConfig.json");
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

            for (const [guildId, guild] of client.guilds.cache) {
                const config = await BotConfig.findOne({ GuildID: guildId });
                const serviceConfig = config?.services?.freegames;
                if (!config || !serviceConfig?.enabled) continue;

                const channelId = serviceConfig.ChannelID;
                if (!channelId) continue;

                const channel = guild.channels.cache.get(channelId);
                if (!channel) continue;

                // Loop through each game to send an embed for it
                for (const game of allGames) {
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
                }

                // Delete messages of expired games for that guild
                await deleteExpiredGameMessages(channel);
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

                    if (endDate < now) await message.delete();
                }
            }
        }

        lastMessageId = messages.last().id;
    }
}