const { EmbedBuilder } = require('discord.js');
// costruire qui l'embed con requestedBy ecc...

module.exports = async (player, client) => {
    player.events
        // GENERAL EVENTS:

        // Emitted when the player starts to play a song
        .on('playerStart', async (queue, track) => {
            try {
                const embed = new EmbedBuilder()
                    .setDescription(`\`🎶\` Started playing **${track.title}** from \`${track.source}\``)
                    .setColor("Greyple");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            } catch (err) {
                console.error(err);

                const embed = new EmbedBuilder()
                    .setDescription("`⛔` Something went wrong...")
                    .setColor("Red");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            }
        })

        // Emitted when the player adds a single song to its queue
        .on('audioTrackAdd', async (queue, track) => {
            try {
                const embed = new EmbedBuilder()
                    .setDescription(`\`🎶\` Queued **${track.title}** from \`${track.source}\``)
                    .setColor("Greyple");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            } catch (err) {
                console.error(err);

                const embed = new EmbedBuilder()
                    .setDescription("`⛔` Something went wrong...")
                    .setColor("Red");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            }
        })

        // Emitted when the player adds multiple songs to its queue
        .on('audioTracksAdd', async (queue, tracks) => {
            try {
                const embed = new EmbedBuilder()
                    .setDescription(`\`🎶\` ${tracks.size} tracks queued`)
                    .setColor("Greyple");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            } catch (err) {
                console.error(err);

                const embed = new EmbedBuilder()
                    .setDescription("`⛔` Something went wrong...")
                    .setColor("Red");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            }
        })

        // Emitted when the audio player fails to load the stream for a song
        .on('playerSkip', async (queue, track) => {
            try {
                const embed = new EmbedBuilder()
                    .setDescription(`\`⏭️\` Skipped **${track.title}** due to an issue!`)
                    .setColor("Greyple");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            } catch (err) {
                console.error(err);

                const embed = new EmbedBuilder()
                    .setDescription("`⛔` Something went wrong...")
                    .setColor("Red");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            }
        })

        // Emitted when the bot leaves the voice channel
        .on('disconnect', async (queue) => {
            try {
                const embed = new EmbedBuilder()
                    .setDescription('`👋` Looks like my job here is done, leaving now!')
                    .setColor("Greyple");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            } catch (err) {
                console.error(err);

                const embed = new EmbedBuilder()
                    .setDescription("`⛔` Something went wrong...")
                    .setColor("Red");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            }
        })

        // Emitted when the voice channel has been empty for the set threshold
        // Bot will automatically leave the voice channel with this event
        .on('emptyChannel', async (queue) => {
            try {
                const embed = new EmbedBuilder()
                    .setDescription('`👋` Leaving because the voice channel is empty!')
                    .setColor("Greyple");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            } catch (err) {
                console.error(err);

                const embed = new EmbedBuilder()
                    .setDescription("`⛔` Something went wrong...")
                    .setColor("Red");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            }
        })

        // Emitted when the player queue has finished
        .on('emptyQueue', async (queue) => {
            try {
                const embed = new EmbedBuilder()
                    .setDescription('`👋` The queue has ended, leaving the voice channel!')
                    .setColor("Greyple");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            } catch (err) {
                console.error(err);

                const embed = new EmbedBuilder()
                    .setDescription("`⛔` Something went wrong...")
                    .setColor("Red");

                const message = await queue.metadata.channel.send({ embeds: [embed] });

                setTimeout(() => {
                    if (message && message.deletable) message.delete().catch(() => { });
                }, 10_000);
            }
        });

    // DEBUG EVENTS:
    // Emitted when the player sends debug info
    // Useful for seeing what dependencies, extractors, etc are loaded
    // player.on('debug', async (message) => {
    //     console.log(`General player debug event: ${message}`);
    // });

    // Emitted when the player queue sends debug info
    // Useful for seeing what state the current queue is at
    // player.events.on('debug', async (queue, message) => {
    //     console.log(`Player debug event: ${message}`);
    // });
}