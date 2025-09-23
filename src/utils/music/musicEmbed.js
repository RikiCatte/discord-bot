const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const msgConfig = require("../../messageConfig.json");
const BotConfig = require("../../schemas/BotConfig");
const { updateServiceConfig } = require("../../utils/BotConfig/");

class MusicEmbedHandler {
    constructor(client) {
        this.client = client;
    }

    static defaultEmbedDescription = [
        "",
        "- Type ** play song name** or paste a **link** to start playing music!",
        "- Use buttons to control playback.",
        "- Type **/help** to see all commands.",
        "",
        "**Note:** The bot requires the `Connect` and `Speak` permissions to function properly.",
        "",
        "`🎉` Enjoy your music!"
    ];

    static defaultEmbedColor = "Blurple";

    static defaultEmbedFields = [
        {
            name: "`🍀` Usage Examples",
            value: [
                "- `play faded - alan walker`",
                "- `play lofi hip hop hits`",
                "- `play https://youtu.be/60ItHLz5WEA`",
                "- `play https://open.spotify.com/track/698ItKASDavgwZ3WjaWjtz`",
                "- `play https://soundcloud.com/alanwalker/faded-1`"
            ].join("\n"),
            inline: true
        },
        {
            name: "`💥` Characteristics",
            value: [
                "- `🕛` 24/7 - Continuous music playback",
                "- `🎵` Multiple Providers - Supports YouTube, SoundCloud and Spotify",
                "- `📱` Autocomplete - Automatically complete song titles (SoundCloud/YouTube)",
                "- `🪛` FFMPEG Audio Filters - Apply various audio effects",
                "- `🎛️` Equalizer - Fine-tune your audio experience",
                "- `⚙️` Biquad Filters - Advanced audio filtering options",
                "- `📜` Queue - Manage your song list",
                "- `🔉` Volume - Control the playback volume",
                "- `🔁` Loop/Shuffle - Loop and Shuffle your songs"
            ].join("\n"),
            inline: true
        },
        {
            name: "`❓` How to Use",
            value: [
                "- Join a voice channel",
                "- Type a song name or paste a link (`YouTube` / `Spotify` / `SoundCloud` are supported (both individual tracks and playlists))",
                "- Type `play song name` or `play link` in this channel. You can also use the `/play` command if you prefer",
                "- In the rest of the server you have to use slash commands (`/play`, `/pause`, `/skip`, `...`).",
                "- When using the `/play` command, let the autocomplete help you out choosing the right song",
                "- Use buttons to control playback (You need the DJ role to use them)",
                "- If you want you can manipulate filters, equalizer and biquad settings to your liking using (`/filter`, `/equalizer`, `/biquad`)",
                "- Type `/help` to see all commands"
            ].join("\n"),
            inline: false
        }
    ];

    static defaultEmbedImage = "https://i.imgur.com/dsoHbzN.gif"; // Music spectrum animation

    static defaultEmbedFooter = { text: "RikiCatte's Music Player", iconURL: msgConfig.author_img };

    static playingMusicGif = "https://i.imgur.com/Erl7H1q.gif"; // Spongebob dancing gif
    static pausedMusicGif = "https://i.imgur.com/mDFGtCn.gif"; // Spongebob paused gif
    static discoStrobeGif = "https://i.imgur.com/UR844AO.gif"; // Disco strobe gif

    async createMusicEmbed(channelId, guildId) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) throw new Error("Channel not found");

            const guild = await this.client.guilds.fetch(guildId);
            if (!guild) throw new Error("Guild not found");

            const embed = new EmbedBuilder()
                .setAuthor({ name: "RikiCatte's Music Player", iconURL: msgConfig.author_img, url: msgConfig.author_link })
                .setDescription(MusicEmbedHandler.defaultEmbedDescription.join("\n"))
                .setColor(MusicEmbedHandler.defaultEmbedColor)
                .addFields(MusicEmbedHandler.defaultEmbedFields)
                .setImage(MusicEmbedHandler.defaultEmbedImage)
                .setThumbnail(MusicEmbedHandler.playingMusicGif)
                .setFooter(MusicEmbedHandler.defaultEmbedFooter)
                .setTimestamp();

            const config = await BotConfig.findOne({ GuildID: guildId });
            if (!config) throw new Error("Guild configuration not found");
            const serviceConfig = config.services?.music;
            if (!serviceConfig || !serviceConfig.enabled) throw new Error("Music service is not enabled");

            const message = await channel.send({ embeds: [embed] });

            await updateServiceConfig(config, "music", { EmbedMessageID: message.id });

            return message;
        } catch (error) {
            console.error("Error creating music embed:", error);
            return null;
        }
    }

    async resetAllMusicEmbedsOnStartup() {
        try {
            let resetCount = 0;
            let errorCount = 0;

            for (const [guildId, guild] of this.client.guilds.cache) {
                let config = null;
                try {
                    config = await BotConfig.findOne({ GuildID: guildId });
                    const serviceConfig = config?.services?.music;
                    if (!config || !serviceConfig?.enabled) continue;

                    const channel = await this.client.channels.fetch(serviceConfig.EmbedChannelID).catch(() => null);
                    if (!channel) {
                        console.log(`⚠️ Embed channel not set for guild ${guild.name} (${guildId}). Skipping...`);
                        continue;
                    }

                    const bot = guild.members.me;
                    if (!channel.permissionsFor(bot).has(["SendMessages", "EmbedLinks", "ViewChannel"])) console.log(`⚠️ Missing permissions in the embed channel for guild ${guild.name} (${guildId}) (i need 'SendMessages', 'EmbedLinks', and 'ViewChannel'). Skipping...`);

                    const musicEmbedMessageId = await channel.messages.fetch(serviceConfig.EmbedMessageID).catch(() => null);
                    if (!musicEmbedMessageId) {
                        console.log(`👍 Embed message not found in the embed channel for guild ${guild.name} (${guildId}). Creating a new one...`);

                        const newMessage = await this.createMusicEmbed(serviceConfig.EmbedChannelID, guildId);

                        if (newMessage) resetCount++;

                        continue;
                    }

                    await this.updateMusicEmbed(guildId, null);
                    resetCount++;

                    await new Promise(res => setTimeout(res, 1000));
                } catch (error) {
                    errorCount++;
                    console.error(`Error resetting music embed for guild ${guildId}: `, error);

                    if (error.code === 50001 || error.code === 1003 || error.code === 50013) await updateServiceConfig(config, "music", { EmbedMessageID: null });
                }
            }
        } catch (error) {
            console.error("Error resetting music embeds:", error);
        }
    }

    async updateMusicEmbed(guildId, trackInfo = null) {
        try {
            const config = await BotConfig.findOne({ GuildID: guildId });
            if (!config) throw new Error("Guild configuration not found");
            const serviceConfig = config.services?.music;
            if (!serviceConfig || !serviceConfig.enabled) throw new Error("Music service is not enabled");

            const channel = await this.client.channels.fetch(serviceConfig.EmbedChannelID);
            if (!channel) throw new Error("Embed channel not found");

            const message = await channel.messages.fetch(serviceConfig.EmbedMessageID);
            if (!message) throw new Error("Embed message not found");

            let embed, components = [];

            if (trackInfo) {
                const statusEmoji = trackInfo.paused ? "⏸️" : "▶️";
                const statusText = trackInfo.paused ? "Paused" : "Playing";
                const loopEmoji = this.getLoopEmoji(trackInfo.loop);

                const embedColor = trackInfo.paused ? "Orange" : "Blurple";

                embed = new EmbedBuilder()
                    .setAuthor({ name: `${trackInfo.title}`, iconURL: MusicEmbedHandler.discoStrobeGif, url: msgConfig.author_link })
                    .setDescription([
                        `\`👤\` **Requested By:** <@${trackInfo.requester.id}>`,
                        `\`🎤\` **Artist:** ${trackInfo.author}`,
                        `\`🔌\` **Source:** \`${trackInfo.source}\``,
                        "",
                        `\`⏱️\` **Duration:** ${this.formatDuration(trackInfo.duration)}`,
                        `\`📊\` **Progress:** \`${this.formatDuration(trackInfo.currentDuration)} / ${this.formatDuration(trackInfo.duration)}\``,
                        `${trackInfo.progressBar || ""}`,
                        `\`${loopEmoji}\` **Loop:** \`${trackInfo.loop || "Off"}\``,
                        `\`🔉\` **Volume:** \`${trackInfo.volume || 100}%\``,
                        "",
                        `\`🪛\` **Biquad Filter:** \`${trackInfo.biquad && trackInfo.biquad !== "off" ? trackInfo.biquad : "Off"}\``,
                        `\`🎛️\` **Equalizer:** \`${trackInfo.equalizer ? trackInfo.equalizer : "Off"}\``,
                        `\`⚙️\` **FFMPEG Filters:** \`${trackInfo.ffmpegFilters && trackInfo.ffmpegFilters.length > 0 ? trackInfo.ffmpegFilters.join(", ") : "Off"}\``,
                        "",
                        "`❓` Need help? Type `/help` to see all commands!",
                        "`🎉` Enjoy your music!"
                    ].join("\n"))
                    .setColor(embedColor)
                    .setThumbnail(trackInfo.thumbnail || MusicEmbedHandler.discoStrobeGif)
                    .setImage(trackInfo.paused ? MusicEmbedHandler.pausedMusicGif : MusicEmbedHandler.playingMusicGif)
                    .setFooter({ text: `RikiCatte's Music Player | ${statusEmoji} ${statusText}`, iconURL: msgConfig.author_img })
                    .setTimestamp();

                components = this.createActionRow(trackInfo);
            } else {
                embed = new EmbedBuilder()
                    .setAuthor({ name: "RikiCatte's Music Player", iconURL: MusicEmbedHandler.discoStrobeGif, url: msgConfig.author_link })
                    .setDescription(MusicEmbedHandler.defaultEmbedDescription.join("\n"))
                    .setColor(MusicEmbedHandler.defaultEmbedColor)
                    .addFields(MusicEmbedHandler.defaultEmbedFields)
                    .setImage(MusicEmbedHandler.defaultEmbedImage)
                    .setThumbnail(MusicEmbedHandler.playingMusicGif)
                    .setFooter(MusicEmbedHandler.defaultEmbedFooter)
                    .setTimestamp();

                components = [];
            }

            await message.edit({ embeds: [embed], components: components || [] });
        } catch (error) {
            console.error('Error updating central embed:', error);
        }
    }

    createActionRow(trackInfo) {
        if (!trackInfo) return [];

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("music_skip")
                    .setEmoji("⏭️")
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId(trackInfo.paused ? "music_resume" : "music_pause")
                    .setEmoji(trackInfo.paused ? "▶️" : "⏸️")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId("music_stop")
                    .setEmoji("🛑")
                    .setStyle(ButtonStyle.Danger),

                new ButtonBuilder()
                    .setCustomId("music_queue")
                    .setEmoji("📜")
                    .setStyle(ButtonStyle.Success),

                new ButtonBuilder()
                    .setCustomId("music_loop")
                    .setLabel("\u200B\u200BLoop\u200B")
                    .setEmoji(this.getLoopEmoji(trackInfo.loop))
                    .setStyle(ButtonStyle.Primary),
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("music_volume_down")
                    .setEmoji("🔉")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("music_volume_up")
                    .setEmoji("🔊")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("music_clear")
                    .setEmoji("🗑️")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("music_shuffle")
                    .setEmoji("🔀")
                    .setStyle(ButtonStyle.Secondary),

                new ButtonBuilder()
                    .setCustomId("music_support")
                    .setEmoji("🆘")
                    .setStyle(ButtonStyle.Danger),
            );

        return [row1, row2];
    }

    getLoopEmoji(loopMode) {
        switch (loopMode) {
            case "track": return "🔂";
            case "queue": return "🔁";
            default: return "⏺️";
        }
    }

    formatDuration(duration) {
        if (!duration || isNaN(duration)) return "00:00";

        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

module.exports = MusicEmbedHandler;