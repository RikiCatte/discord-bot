const { useMainPlayer } = require("discord-player");
const { SoundCloudExtractor } = require("@discord-player/extractor");

async function playSong({ client, guild, user, voiceChannel, query, channel }) {
    const player = useMainPlayer();

    if (query.includes("spotify.com")) {
        const message = await channel.send("`ℹ️` Spotify links are supported, but playback will use YouTube as provider for each track.");
        setTimeout(() => {
            if (message.deletable) message.delete().catch(() => { });
        }, 10_000);

        let searchOptions = { requestedBy: user };
        const searchResult = await player.search(query, searchOptions);

        if (!searchResult.hasTracks()) {
            const message = await channel.send(`\`⚠️\` No results were found for query: **${query}**.`);
            setTimeout(() => {
                if (message.deletable) message.delete().catch(() => { });
            }, 10_000);
            return false;
        }

        for (const track of searchResult.tracks) {
            const ytQuery = `${track.title} ${track.author}`;
            const ytResult = await player.search(ytQuery, { requestedBy: user });

            if (ytResult.hasTracks()) {
                try {
                    await player.play(voiceChannel, ytResult, {
                        nodeOptions: { metadata: { channel } }
                    });
                } catch (err) {
                    console.error(`Error playing track "${track.title}":`, err);
                }
            } else {
                const message = await channel.send(`\`⚠️\` Could not find **${track.title}** on YouTube.`);
                setTimeout(() => {
                    if (message.deletable) message.delete().catch(() => { });
                }, 10_000);
            }
        }
        return true;
    }

    if (query.includes("soundcloud.com")) {
        if (query.includes("on.soundcloud.com/")) {
            const message = await channel.send("`⚠️` Shortened SoundCloud links (on.soundcloud.com/...) are not supported. Please use the full link (soundcloud.com/artist/track).");
            setTimeout(() => {
                if (message.deletable) message.delete().catch(() => { });
            }, 10_000);
            return false;
        }

        let cleanQuery = query.split("?")[0];

        const match = cleanQuery.match(/soundcloud\.com\/([^/]+)\/([^/?]+)/);
        const expectedArtist = match ? match[1].toLowerCase() : null;
        const expectedTitle = match ? match[2].toLowerCase() : null;

        let searchOptions = { requestedBy: user, searchEngine: `ext:${SoundCloudExtractor.identifier}` };
        const searchResult = await player.search(cleanQuery, searchOptions);

        const fallbackToYouTube = async () => {
            const autoResults = await player.search(cleanQuery, { requestedBy: user });
            if (autoResults.hasTracks()) {
                const suggestedTitle = `${autoResults.tracks[0].title} ${autoResults.tracks[0].author}`;
                const ytResult = await player.search(suggestedTitle, { requestedBy: user });
                if (ytResult.hasTracks()) {
                    const message = await channel.send("`⚠️` SoundCloud link not playable, using YouTube as fallback.");
                    setTimeout(() => {
                        if (message.deletable) message.delete().catch(() => { });
                    }, 10_000);
                    try {
                        await player.play(voiceChannel, ytResult, {
                            nodeOptions: { metadata: { channel } }
                        });
                        return true;
                    } catch (err) {
                        console.error(err);
                        const message = await channel.send("`⛔` Something went wrong while trying to play the song from YouTube.");
                        setTimeout(() => {
                            if (message.deletable) message.delete().catch(() => { });
                        }, 10_000);
                        return false;
                    }
                }
            }
            const message = await channel.send("`⚠️` Could not find the track on YouTube either.");
            setTimeout(() => {
                if (message.deletable) message.delete().catch(() => { });
            }, 10_000);
            return false;
        };

        let wrongTrack = false;
        if (
            !searchResult.hasTracks() ||
            !searchResult.tracks[0] ||
            !searchResult.tracks[0].author ||
            !searchResult.tracks[0].title ||
            (expectedArtist && !searchResult.tracks[0].author.toLowerCase().includes(expectedArtist)) ||
            (expectedTitle && !searchResult.tracks[0].title.toLowerCase().includes(expectedTitle.replace(/-/g, " ")))
        ) {
            wrongTrack = true;
        }

        if (wrongTrack) return await fallbackToYouTube();

        try {
            const { track } = await player.play(voiceChannel, searchResult, {
                nodeOptions: { metadata: { channel } }
            });
            return true;
        } catch (err) {
            console.error(err);
            return await fallbackToYouTube();
        }
    }

    let searchOptions = { requestedBy: user };

    const searchResult = await player.search(query, searchOptions);

    if (!searchResult.hasTracks()) {
        const message = await channel.send(`\`⚠️\` No results were found for query: **${query}**.`);
        setTimeout(() => {
            if (message.deletable) message.delete().catch(() => { });
        }, 10_000);
        return false;
    }

    try {
        const { track } = await player.play(voiceChannel, searchResult, {
            nodeOptions: { metadata: { channel } }
        });
        return true;
    } catch (err) {
        console.error(err);
        const message = await channel.send("`⛔` Something went wrong while trying to play the song.");
        setTimeout(() => {
            if (message.deletable) message.delete().catch(() => { });
        }, 10_000);
        return false;
    }
}

module.exports = playSong;