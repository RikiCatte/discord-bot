const BotConfig = require("../../schemas/BotConfig");
const { useQueue } = require("discord-player");

class ConditionChecker {
    constructor(client) {
        this.client = client;
    }

    async checkMusicConditions(guildId, userId, voiceChannelId, fromCentral = false) {
        const queue = useQueue(guildId);
        const guild = this.client.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(userId);

        const config = await BotConfig.findOne({ GuildID: guildId });
        if (!config) return `⚠️ No configuration found for server ${guildId}.`;

        const serviceConfig = config.services?.music;
        if (!serviceConfig?.enabled) return `⚠️ Music service is not enabled on this server.`;

        if (!serviceConfig.EmbedMessageID) return '⚠️ Music embed message is not configured. Please set it up in the bot configuration.';

        const serviceEnabled = serviceConfig.enabled;
        const centralVC = serviceConfig.VoiceChannelID;

        return {
            hasActivePlayer: !!queue,
            isPlaying: !!queue?.currentTrack,
            isPaused: queue?.node?.isPaused() || false,

            botVoiceChannel: queue?.channel?.id,
            userVoiceChannel: voiceChannelId,
            userInVoice: !!voiceChannelId,
            sameVoiceChannel: queue?.channel?.id === voiceChannelId,

            centralEnabled: serviceEnabled,
            centralVC: centralVC,
            isCentralVC: centralVC === voiceChannelId,
            botInCentralVC: queue?.channel?.id === centralVC,
            fromCentral: fromCentral,

            canJoinVoice: member?.voice.channel ?
                member.voice.channel.permissionsFor(guild.members.me)?.has(['Connect', 'Speak']) : false,

            queueLength: queue?.tracks?.size || 0,
            currentTrack: queue?.currentTrack || null,

            queue: queue
        };
    }

    async canUseMusic(guildId, userId) {
        const config = await BotConfig.findOne({ GuildID: guildId });

        if (!config.services?.music?.DJRoleID) return true;

        const guild = this.client.guilds.cache.get(guildId);
        const member = guild?.members.cache.get(userId);

        return member?.roles.cache.has(config.services.music.DJRoleID) || false;
    }

    getErrorMessage(conditions, action = 'play') {
        if (!conditions.userInVoice) {
            return '❌ You need to be in a voice channel to use music commands!';
        }

        if (!conditions.canJoinVoice) {
            return '❌ I don\'t have permission to join your voice channel!';
        }

        if (conditions.hasActivePlayer && !conditions.sameVoiceChannel) {
            if (conditions.botInCentralVC && !conditions.fromCentral) {
                if (conditions.centralEnabled && conditions.centralVC) {
                    return `❌ I'm currently in the central music system! Join <#${conditions.centralVC}> or use the central channel to control music.`;
                }
            }

            if (!conditions.botInCentralVC && conditions.fromCentral && conditions.centralVC) {
                return null;
            }

            return '❌ I\'m already playing music in a different voice channel!';
        }

        if (action === 'skip' && !conditions.isPlaying) {
            return '❌ Nothing is currently playing to skip!';
        }

        if (action === 'pause' && !conditions.isPlaying) {
            return '❌ Nothing is currently playing to pause!';
        }

        return null;
    }
}

module.exports = ConditionChecker;