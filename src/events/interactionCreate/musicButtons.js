const { MessageFlags } = require("discord.js");
const ConditionChecker = require("../../utils/music/checkMusicCondition");
const MusicEmbed = require("../../utils/music/musicEmbed");
const { getInnertube } = require("../../utils/music/innertube");
const { getMaxUploadSize } = require("../../utils/utils.js");
const { downloadTrackToMp3 } = require("../../utils/music/downloadTrack");
const fs = require('fs');

module.exports = async (client, interaction) => {
    if (!interaction || !interaction.isButton() || !interaction.inGuild() || !interaction.customId.includes("music")) return;

    const checker = new ConditionChecker(client);

    try {
        const conditions = await checker.checkMusicConditions(interaction.guild.id, interaction.member.id, interaction.member.voice?.channelId, true);

        if (!conditions.hasActivePlayer) return interaction.reply({ content: "`⚠️` No music is currently being played in this guild.", flags: MessageFlags.Ephemeral });

        if (!conditions.userInVoice) return await interaction.reply({ content: "`⚠️` You need to be in a voice channel to use music controls.", flags: MessageFlags.Ephemeral });

        if (!conditions.sameVoiceChannel) {
            const botChannelName = interaction.guild.channels.cache.get(conditions.botVoiceChannel)?.name || "Unknown Channel";
            return await interaction.reply({ content: `\`⚠️\` You need to be in the same voice channel as me to use music controls! I'm currently active in **${botChannelName}**.`, flags: MessageFlags.Ephemeral });
        }

        const canUseMusic = await checker.canUseMusic(interaction.guild.id, interaction.member.id);
        if (!canUseMusic) return await interaction.reply({ content: "`⚠️` You don't have permission to use music controls. You need the DJ role to use music commands.", flags: MessageFlags.Ephemeral });

        const queue = conditions.queue;
        const action = interaction.customId.replace("music_", "");
        const embedHandler = new MusicEmbed(client);

        switch (action) {
            case "pause":
                if (!conditions.isPlaying) return await interaction.reply({ content: "`⚠️` There's no music currently playing to pause.", flags: MessageFlags.Ephemeral });
                await queue.node.setPaused(true);
                await interaction.reply({ content: "`⏸️` Music playback paused.", flags: MessageFlags.Ephemeral });
                await updateEmbed();
                break;
            case "resume":
                if (!conditions.isPlaying) return await interaction.reply({ content: "`⚠️` There's no music currently playing to resume.", flags: MessageFlags.Ephemeral });
                await queue.node.setPaused(false);
                await interaction.reply({ content: "`▶️` Music playback resumed.", flags: MessageFlags.Ephemeral });
                await updateEmbed();
                break;
            case "skip":
                if (!conditions.isPlaying || queue.tracks.size < 1) return await interaction.reply({ content: "`⚠️` There's no music currently playing to skip or no tracks in the queue.", flags: MessageFlags.Ephemeral });
                const currentTrack = queue.currentTrack.cleanTitle;
                await queue.node.skip();
                await interaction.reply({ content: `\`⏭️\` Skipped **${currentTrack}**`, flags: MessageFlags.Ephemeral });
                await updateEmbed();
                break;
            case "stop":
                if (!conditions.queue) return await interaction.reply({ content: "`⚠️` There's no active music session to stop.", flags: MessageFlags.Ephemeral });
                await queue.clear();
                await queue.node.stop();
                await interaction.reply({ content: "`🛑` Music playback stopped and disconnected.", flags: MessageFlags.Ephemeral });
                await updateEmbed();
                break;
            case "clear":
                if (!conditions.queue) return await interaction.reply({ content: "`⚠️` There's no active music session to clear.", flags: MessageFlags.Ephemeral });
                await queue.clear();
                await interaction.reply({ content: "`🗑️` Music queue cleared.", flags: MessageFlags.Ephemeral });
                await updateEmbed();
                break;
            case "loop":
                if (!conditions.isPlaying) return await interaction.reply({ content: "`⚠️` There's no music currently playing to loop.", flags: MessageFlags.Ephemeral });

                const loopEmojis = { none: '➡️', track: '🔂', queue: '🔁' };

                let newMode;
                switch (queue.repeatMode) {
                    case 0:
                        newMode = 1; // OFF -> TRACK
                        break;
                    case 1:
                        newMode = 2; // TRACK -> QUEUE
                        break;
                    case 2:
                        newMode = 0; // QUEUE -> OFF
                        break;
                    default:
                        newMode = 0; // DEFAULT TO OFF
                }

                await queue.setRepeatMode(newMode);

                let modeText, emoji;
                if (newMode === 0) {
                    modeText = "Loop off";
                    emoji = loopEmojis.none;
                } else if (newMode === 1) {
                    modeText = "Looping current track";
                    emoji = loopEmojis.track;
                } else {
                    modeText = "Looping queue";
                    emoji = loopEmojis.queue;
                }

                await interaction.reply({ content: `\`${emoji}\` ${modeText}.`, flags: MessageFlags.Ephemeral });
                await updateEmbed();
                break;
            case "volume_up":
                if (!conditions.isPlaying) return await interaction.reply({ content: "`⚠️` There's no music currently playing to adjust volume.", flags: MessageFlags.Ephemeral });
                const currentVolume = queue.node.volume;
                if (currentVolume === 100) return await interaction.reply({ content: "`⚠️` Volume is already at maximum (100%).", flags: MessageFlags.Ephemeral });
                if (currentVolume + 10 > 100) return await interaction.reply({ content: "`⚠️` Increasing volume by 10% would exceed the maximum of 100%.", flags: MessageFlags.Ephemeral });
                await queue.node.setVolume(Math.min(currentVolume + 10, 100));
                await interaction.reply({ content: `\`🔊\` Volume increased to **${queue.node.volume}%** from **${currentVolume}%**.`, flags: MessageFlags.Ephemeral });
                await updateEmbed();
                break;
            case "volume_down":
                if (!conditions.isPlaying) return await interaction.reply({ content: "`⚠️` There's no music currently playing to adjust volume.", flags: MessageFlags.Ephemeral });
                const currVolume = queue.node.volume;
                if (currVolume === 0) return await interaction.reply({ content: "`⚠️` Volume is already at minimum (0%).", flags: MessageFlags.Ephemeral });
                if (currVolume - 10 < 0) return await interaction.reply({ content: "`⚠️` Decreasing volume by 10% would go below the minimum of 0%.", flags: MessageFlags.Ephemeral });
                await queue.node.setVolume(Math.max(currVolume - 10, 0));
                await interaction.reply({ content: `\`🔉\` Volume decreased to **${queue.node.volume}%** from **${currVolume}%**.`, flags: MessageFlags.Ephemeral });
                await updateEmbed();
                break;
            case "queue":
                if (!conditions.queue) return await interaction.reply({ content: "`⚠️` There's no active music session to show the queue for.", flags: MessageFlags.Ephemeral });
                if (queue.tracks.size === 0) return await interaction.reply({ content: "`⚠️` The music queue is currently empty.", flags: MessageFlags.Ephemeral });

                const queueList = queue.tracks.map((track, index) => {
                    let title = track.title.length > 30 ? track.title.slice(0, 27) + '...' : track.title;
                    let author = track.author.length > 30 ? track.author.slice(0, 27) + '...' : track.author;
                    return `${index + 1}. ${title} - ${author}`;
                }).slice(0, 10).join('\n');

                const moreText = queue.tracks.size > 10 ? `\n...and ${queue.tracks.size - 10} more tracks.` : '';

                await interaction.reply({ content: `\`🎶\` **Queue (${queue.tracks.size} songs)**\n${queueList}${moreText}`, flags: MessageFlags.Ephemeral });
                break;
            case "shuffle":
                if (!conditions.queue) return await interaction.reply({ content: "`⚠️` There's no active music session to shuffle the queue for.", flags: MessageFlags.Ephemeral });
                if (queue.tracks.size < 2) return await interaction.reply({ content: "`⚠️` Need at least 2 tracks in the queue to shuffle.", flags: MessageFlags.Ephemeral });
                await queue.tracks.shuffle();
                await interaction.reply({ content: `\`🔀\` Shuffled ${queue.tracks.size} tracks in the queue.`, flags: MessageFlags.Ephemeral });
                await updateEmbed();
                break;
            case "download":
                if (!conditions.isPlaying) return interaction.reply({ content: "`⚠️` There's no music currently playing to download.", flags: MessageFlags.Ephemeral });

                await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                try {
                    const outputPath = await downloadTrackToMp3({ track: queue.currentTrack, getInnertube });

                    const stats = fs.statSync(outputPath);
                    const maxSize = getMaxUploadSize(interaction.guild);

                    if (stats.size > maxSize) await interaction.editReply({ content: `\`⚠️\` The downloaded file exceeds Discord's upload limit for this guild (${(maxSize / 1024 / 1024).toFixed(2)}MB).`, flags: MessageFlags.Ephemeral });
                    else await interaction.editReply({ content: `\`💾\` **Disclaimer**: This feature is for personal/educational use only. Developers will not assume any responsibility for the content downloaded. \nDownload for **${queue.currentTrack.title}**:`, files: [outputPath] });

                    fs.unlinkSync(outputPath);
                } catch (err) {
                    await interaction.editReply({ content: "`⚠️` An error occurred while processing the download.", flags: MessageFlags.Ephemeral });
                }
                break;
            default:
                return await interaction.reply({ content: "`⚠️` Unknown music control action.", flags: MessageFlags.Ephemeral });
        }

        async function updateEmbed() {
            if (queue && queue.currentTrack) {
                const current = queue.currentTrack;
                const queueInfo = {
                    title: current?.title,
                    author: current?.author,
                    duration: current?.durationMS || current?.duration,
                    thumbnail: current?.thumbnail,
                    requester: current?.requestedBy,
                    paused: queue.node.isPaused(),
                    volume: queue.node.volume,
                    loop: queue.repeatMode,
                    queueLength: queue.tracks.size
                };
                await embedHandler.updateMusicEmbed(interaction.guild.id, queueInfo);
            }
        }
    } catch (error) {
        console.error("Error while handling music button interaction: ", error);
        return await interaction.reply({ content: `\`⚠️\` An error occurred while processing your request`, flags: MessageFlags.Ephemeral }).catch(() => { });
    }
}