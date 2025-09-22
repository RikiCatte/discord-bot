const { ActivityType, ChannelType } = require("discord.js");
const { useQueue } = require("discord-player");

class StatusManager {
    constructor(client) {
        this.client = client;
        this.currentInterval = null;
        this.isPlaying = false;
        this.voiceChannelData = new Map();
    }

    async updateStatusAndVoice(guildId) {
        try {
            const queue = useQueue(guildId);
            const isPlaying = queue && queue.currentTrack;
            const trackTitle = isPlaying ? queue.currentTrack.title : null;

            if (isPlaying) {
                await this.setPlayingStatus(trackTitle);
                await this.setVoiceChannelStatus(guildId, trackTitle);
            } else {
                await this.setDefaultStatus();
                await this.clearVoiceChannelStatus(guildId);
            }
        } catch (error) {
            console.error(`Error updating status and voice channel for guild ${guildId}: `, error);
        }
    }

    async setPlayingStatus(trackTitle) {
        this.stopCurrentStatus();
        this.isPlaying = true;

        const activity = `🎵 ${trackTitle}`;

        await this.client.user.setPresence({
            activities: [{
                name: activity,
                type: ActivityType.Listening
            }],
            status: 'online'
        });

        this.currentInterval = setInterval(async () => {
            if (this.isPlaying) {
                await this.client.user.setPresence({
                    activities: [{
                        name: activity,
                        type: ActivityType.Listening
                    }],
                    status: 'online'
                });
            }
        }, 30_000);
    }

    async setVoiceChannelStatus(guildId, trackTitle) {
        try {
            const queue = useQueue(guildId);
            if (!queue || !queue.channel) return;

            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;

            const voiceChannel = queue.channel;
            if (!voiceChannel) return;

            if (!this.voiceChannelData.has(voiceChannel.id)) {
                this.voiceChannelData.set(voiceChannel.id, {
                    originalName: voiceChannel.name,
                    originalTopic: voiceChannel.topic
                });
            }

            const bot = guild.members.me;
            const permissions = voiceChannel.permissionsFor(bot);

            if (!permissions?.has("ManageChannels"))
                return console.log(`⚠️ Missing 'Manage Channels' permission in voice channel ${voiceChannel.name} (${voiceChannel.id}) in guild ${guild.name} (${guild.id})`);

            const statusText = `🎵 ${trackTitle.length > 20 ? trackTitle.slice(0, 17) + '...' : trackTitle}`;

            let success = await this.createVoiceStatusAPI(voiceChannel.id, statusText);
            if (success) return;

            // await this.createVoiceChannelName(voiceChannel, trackTitle); // Disabled
        } catch (error) {
            console.error(`❌ Voice channel status creation failed: ${error.message}`);
        }
    }

    async clearVoiceChannelStatus(guildId) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;

            const bot = guild.members.me;
            let voiceChannel = null;

            const queue = useQueue(guildId);
            if (queue && queue.channel) voiceChannel = queue.channel;

            if (!voiceChannel && bot.voice.channelId) voiceChannel = bot.voice.channel;

            if (!voiceChannel) {
                for (const channel of guild.channels.cache.values()) {
                    if (channel.type === ChannelType.GuildVoice && this.voiceChannelData.has(channel.id)) {
                        voiceChannel = channel;
                        break;
                    }
                }
            }

            if (!voiceChannel) return;

            const permissions = voiceChannel.permissionsFor(bot);
            if (!permissions?.has("ManageChannels"))
                return console.log(`⚠️ Missing 'Manage Channels' permission in voice channel ${voiceChannel.name} (${voiceChannel.id}) in guild ${guild.name} (${guild.id})`);

            let success = await this.deleteVoiceStatusAPI(voiceChannel.id);
            if (success) return;

            // await this.deleteVoiceChannelName(voiceChannel); // Disabled
        } catch (error) {
            console.error(`❌ Voice channel status clearing failed: ${error.message}`);
        }
    }

    async createVoiceStatusAPI(channelId, statusText) {
        try {
            await this.client.rest.put(`/channels/${channelId}/voice-status`, { body: { status: statusText } });
        } catch (error) {
            console.error(`❌ Voice status API creation failed: ${error.message}`);
            return false;
        }
    }

    async deleteVoiceStatusAPI(channelId) {
        try {
            await this.client.rest.put(`/channels/${channelId}/voice-status`, { body: { status: null } });
            return true;
        } catch (error) {
            try {
                await this.client.rest.delete(`/channels/${channelId}/voice-status`);
                return true;
            } catch (err) {
                console.error(`❌ Voice status API deletion failed: ${err.message}`);
                return false;
            }
        }
    }

    async createVoiceChannelName(voiceChannel, trackTitle) {
        try {
            if (!this.voiceChannelData.has(voiceChannel.id)) {
                this.voiceChannelData.set(voiceChannel.id, {
                    originalName: voiceChannel.name
                });
            }

            const shortTitle = trackTitle.length > 15 ? trackTitle.substring(0, 15) + '...' : trackTitle;
            const newName = `🎵 ${shortTitle}`;

            if (newName !== voiceChannel.name && newName.length <= 100) {
                await voiceChannel.setName(newName);
            }
            return true;
        } catch (error) {
            console.error(`❌ Voice channel name creation failed: ${error.message}`);
            return false;
        }
    }

    async deleteVoiceChannelName(voiceChannel) {
        try {
            const previousData = this.voiceChannelData.get(voiceChannel.id);
            const previousName = previousData?.originalName;

            if (previousName && previousName !== voiceChannel.name) {
                await voiceChannel.setName(previousName);
            }
            this.voiceChannelData.delete(voiceChannel.id);
            return true;
        } catch (error) {
            console.error(`❌ Voice channel name deletion failed: ${error.message}`);
            return false;
        }
    }

    async setDefaultStatus() {
        this.stopCurrentStatus();
        this.isPlaying = false;

        await this.client.user.setPresence({
            status: 'dnd'
        });
    }

    stopCurrentStatus() {
        if (this.currentInterval) {
            clearInterval(this.currentInterval);
            this.currentInterval = null;
        }
    }

    async setServerCountStatus(serverCount) {
        if (!this.isPlaying) {
            await this.client.user.setPresence({
                activities: [{
                    name: `on ${serverCount} servers`,
                    type: ActivityType.Watching
                }],
                status: 'online'
            });
        }
    }

    async onTrackStart(guildId) {
        await this.updateStatusAndVoice(guildId);
    }

    async onTrackEnd(guildId) {
        setTimeout(async () => {
            await this.updateStatusAndVoice(guildId);
        }, 1000);
    }

    async onPlayerDisconnect(guildId = null) {
        await this.setDefaultStatus();

        if (guildId) {
            await this.clearVoiceChannelStatus(guildId);
        } else {
            for (const guild of this.client.guilds.cache.values()) {
                await this.clearVoiceChannelStatus(guild.id);
            }
        }
    }
}

module.exports = StatusManager;