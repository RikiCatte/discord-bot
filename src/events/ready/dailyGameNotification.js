const schedule = require('node-schedule');
const pushNewGames = require("../../utils/freeGames/pushNewGames.js");
const msgConfig = require("../../messageConfig.json");
const { EmbedBuilder } = require("discord.js");

/**
 * Send a daily notification with the list of free games available
 */
module.exports = async function dailyGameNotification(client) {
    // Schedule the job to run every day at 9:00 AM
    schedule.scheduleJob('0 9 * * *', async () => {
        const channel = client.channels.cache.get(msgConfig.freeGamesChannel);

        try {
            // Fetch new games and process them
            const newGames = await pushNewGames(); // Automatically calls getFreeGames and handles duplicates

            if (newGames.length === 0) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img, url: msgConfig.author_url })
                    .setTitle("😔 No new free games available")
                    .setDescription("There are no free games available at the moment. Try again tomorrow.")
                    .setColor("Grey")
                    .setTimestamp();

                return await channel.send({ embeds: [embed] });
            }

            // Loop through each game to send an embed for each
            for (const game of newGames) {
                const embed = new EmbedBuilder()
                    .setAuthor({ name: `${client.user.username}`, iconURL: client.user.displayAvatarURL() })
                    .setTitle(`${game.title} is now free!`)
                    .setDescription(game.description || "No description available")
                    .addFields(
                        { name: "Available for free since", value: new Date(game.startDate).toLocaleDateString(), inline: true },
                        { name: "Available for free until", value: game.endDate ? new Date(game.endDate).toLocaleDateString() : 'No end date', inline: true },
                        { name: "Source", value: game.source || "Unknown", inline: true },
                        { name: "URL", value: `[Click here](${game.url})`, inline: true }
                    )
                    .setColor("Green")
                    .setTimestamp();

                if (game.image) embed.setImage(game.image);

                await channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error("ERROR [dailyGameNotification]: ", error);

            const errorEmbed = new EmbedBuilder()
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img, url: msgConfig.author_url })
                .setTitle("⚠️ Error fetching free games")
                .setDescription("An error occurred while trying to fetch free games. Please try again later.")
                .setColor("Red")
                .setTimestamp();

            await channel.send({ embeds: [errorEmbed] });
        }
    });
}