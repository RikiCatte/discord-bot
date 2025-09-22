const { PermissionFlagsBits } = require("discord.js");
const playSong = require("../../utils/music/playSong");
const BotConfig = require("../../schemas/BotConfig");

module.exports = async (client, message) => {
    if (message.author.bot || !message.guild) return;

    const config = await BotConfig.findOne({ GuildID: message.guild.id });
    const serviceConfig = config?.services?.music;
    if (!config || !serviceConfig?.enabled || !serviceConfig?.EmbedChannelID || !serviceConfig?.EmbedMessageID) return;

    if (message.channel.id !== serviceConfig.EmbedChannelID) return; // If the message is not in the designated music channel, ignore it (IMPORTANT!)

    const content = message.content.trim();
    if (!/^play\s+/i.test(content)) {
        if (message.deletable) await message.delete().catch(() => { });
        return;
    }

    const member = message.guild.members.cache.get(message.author.id);

    if (!member?.voice.channel) { // Member not in any VC
        await message.reply("`⚠️` You must be in a voice channel to play music.").then(msg => {
            setTimeout(() => {
                if (msg.deletable) msg.delete().catch(() => { });
                if (message.deletable) message.delete().catch(() => { });
            }, 10_000);
        }).catch(() => { });
        return;
    }

    if (member?.voice.channel.id !== serviceConfig?.VoiceChannelID) { // Member not in the designated VC
        await message.reply(`\`⚠️\` You must be in the designated voice channel <#${serviceConfig?.VoiceChannelID}> to play music.`).then(msg => {
            setTimeout(() => {
                if (msg.deletable) msg.delete().catch(() => { });
                if (message.deletable) message.delete().catch(() => { });
            }, 10_000);
        }).catch(() => { });
        return;
    }

    if (message.guild.members.me.voice.channelId && member?.voice.channel.id !== message.guild.members.me.voice.channelId) { // Bot already in a different VC
        await message.reply(`\`⚠️\` You can't use the music player because it's already active in <#${message.guild.members.me.voice.channelId}>`).then(msg => {
            setTimeout(() => {
                if (msg.deletable) msg.delete().catch(() => { });
                if (message.deletable) message.delete().catch(() => { });
            }, 10_000);
        }).catch(() => { });
        return;
    }
    if (serviceConfig?.DJRoleID && !member?.roles.cache.has(serviceConfig.DJRoleID)) { // Member lacks DJ role
        await message.reply(`\`⚠️\` You need the <@&${serviceConfig.DJRoleID}> role to use music commands.`).then(msg => {
            setTimeout(() => {
                if (msg.deletable) msg.delete().catch(() => { });
                if (message.deletable) message.delete().catch(() => { });
            }, 10_000);
        }).catch(() => { });
        return;
    }
    if (member?.voice.channel.permissionsFor(message.guild.members.me)?.has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak]) === false) { // Bot lacks permissions
        await message.reply(`\`⚠️\` I need permission to join and speak in your voice channel.`).then(msg => {
            setTimeout(() => {
                if (msg.deletable) msg.delete().catch(() => { });
                if (message.deletable) message.delete().catch(() => { });
            }, 10_000);
        }).catch(() => { });
        return;
    }

    const query = content.slice(5).trim();
    if (!query) return;

    const success = await playSong({
        client,
        guild: message.guild,
        user: message.author,
        voiceChannel: member.voice.channel,
        query,
        channel: message.channel
    });

    if (!success) {
        await message.reply(`\`⚠️\` No results were found for query: **${query}**.`).then(msg => {
            setTimeout(() => {
                if (msg.deletable) msg.delete().catch(() => { });
                if (message.deletable) message.delete().catch(() => { });
            }, 10_000);
        }).catch(() => { });
    } else {
        await message.react("✅").catch(() => { });

        setTimeout(() => {
            if (message.deletable) message.delete().catch(() => { });
        }, 10_000);
    }
}
