const client = require("../../index.js");
const { EmbedBuilder } = require("discord.js");
const msgConfig = require("../../messageConfig.json");

module.exports = async () => {
    const status = queue =>
        `Volume: \`${queue.volume}%\` | Filter: \`${queue.filters.names.join(', ') || 'Off'}\` | Loop: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'All Queue' : 'This Song') : 'Off'
        }\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``
    client.distube
        .on('playSong', (queue, song) =>
            queue.textChannel.send({
                embeds: [
                    new EmbedBuilder()
                        // .setColor("Green")
                        // .setDescription(`\`🎶\` Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user
                        //     }\n${status(queue)}`)
                        .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                        .setColor("Green")
                        .setTitle("\`🎶\` Now Playing")
                        .setDescription(`[${song.name}](${song.url}) - \`${song.formattedDuration}\`\nRequested by: ${song.user}\n${status(queue)}`)
                        .addFields({ name: "Note:", value: 'You can use music commands to manipulate the music player!' })
                        .setThumbnail(msgConfig.thumbnail)
                        .setFooter({ text: "Music Player by RikiCatte using Distube", iconURL: msgConfig.footer_iconURL })
                ]
            })
        )
        .on('addSong', (queue, song) =>
            queue.textChannel.send(
                {
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                            .setColor("Green")
                            .setTitle("\`➕\` Song added to queue")
                            .setDescription(`\`🎶\` Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`)
                            .setThumbnail(msgConfig.thumbnail)
                            .setFooter({ text: "Music Player by RikiCatte using Distube", iconURL: msgConfig.footer_iconURL })
                    ]
                }
            )
        )
        .on('addList', (queue, playlist) =>
            queue.textChannel.send(
                {
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                            .setColor("Green")
                            .setTitle("\`⏭\` Playlist Added to queue")
                            .setDescription(`\`🎶\` Added \`${playlist.name}\` playlist (${playlist.songs.length} songs) to queue\n${status(queue)}`)
                            .setThumbnail(msgConfig.thumbnail)
                            .setFooter({ text: "Music Player by RikiCatte using Distube", iconURL: msgConfig.footer_iconURL })
                    ]
                }
            )
        )
        .on('error', (error, queue, song) => {
            console.error(error);

            if (queue.textChannel) {
                queue.textChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                            .setColor("Red")
                            .setTitle("\`❌\` Error")
                            .setDescription(`\`⛔\` An error has occurred!`)
                            .setThumbnail(msgConfig.thumbnail)
                            .setFooter({ text: "Music Player by RikiCatte using Distube", iconURL: msgConfig.footer_iconURL })
                    ]
                })
            }
        })
        .on('empty', (queue) =>
            queue.textChannel.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                        .setColor("Red")
                        .setTitle("\`🚪\` Leaving VC")
                        .setDescription(`\`⛔\` Leaving because the VC is empty!`)
                        .setThumbnail(msgConfig.thumbnail)
                        .setFooter({ text: "Music Player by RikiCatte using Distube", iconURL: msgConfig.footer_iconURL })
                ]
            })
        )
        .on('searchNoResult', (queue, query) =>
            queue.textChannel.send(
                {
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                        .setColor("Red")
                        .setTitle("\`❌\` No Result")
                        .setDescription(`\`⛔\` No result found for \`${query}\`!`)
                        .setThumbnail(msgConfig.thumbnail)
                        .setFooter({ text: "Music Player by RikiCatte using Distube", iconURL: msgConfig.footer_iconURL })
                    ]
                })
        )
        .on('finish', queue => queue.textChannel.send({
            embeds: [new EmbedBuilder()
                .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                .setColor("Green")
                .setTitle("\`🏁\` Queue finished")
                .setDescription('\`🏁\` no other songs to play!')
                .setThumbnail(msgConfig.thumbnail)
                .setFooter({ text: "Music Player by RikiCatte using Distube", iconURL: msgConfig.footer_iconURL })
            ]
        }))
    // .on('disconnect', (queue) => {
    //     queue.textChannel.send({
    //         embeds: [new EmbedBuilder().setColor("Red")
    //             .setDescription(`\`⛔\` Bot has been disconnected from VC`)]
    //     })
    // })
}