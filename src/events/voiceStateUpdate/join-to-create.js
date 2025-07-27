const { ChannelType, Collection, PermissionFlagsBits } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
let voiceManager = new Collection();

module.exports = async (client, oldState, newState) => {
    const config = await BotConfig.findOne({ GuildID: newState.guild.id });
    const serviceConfig = config?.services?.jointocreate;
    if (!serviceConfig || !serviceConfig.enabled) return;

    const { member, guild } = oldState;
    const newChannel = newState.channel;
    const oldChannel = oldState.channel;

    const channelid = serviceConfig.ChannelID;
    const channel = client.channels.cache.get(channelid);
    const userlimit = serviceConfig.UserLimit;

    if (!channel) return;

    if (oldChannel !== newChannel && newChannel && newChannel.id === channel.id) {
        const existingUserChannelId = voiceManager.get(member.id);

        if (existingUserChannelId) {
            const existingUserChannel = guild.channels.cache.get(existingUserChannelId);
            if (existingUserChannel) await existingUserChannel.delete().catch(error => console.error(error));
        }

        const voiceChannel = await guild.channels.create({
            name: `🔊 | ${member.user.tag}`,
            type: ChannelType.GuildVoice,
            parent: newChannel.parent,
            permissionOverwrites: [
                {
                    id: member.id,
                    allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.ManageChannels],
                },
                {
                    id: guild.id,
                    allow: [PermissionFlagsBits.Connect]
                },
            ],
            userLimit: userlimit
        });

        voiceManager.set(member.id, voiceChannel.id);

        await newChannel.permissionOverwrites.edit(member, { Connect: false });
        setTimeout(() => {
            newChannel.permissionOverwrites.delete(member);
        }, 30000);

        return setTimeout(() => {
            member.voice.setChannel(voiceChannel);
        }, 500);
    }

    const jointocreate = voiceManager.get(member.id);
    const members = oldChannel?.members
        .filter((member) => !member.user.bot)
        .map((member) => member.id);

    if (jointocreate && oldChannel && oldChannel.id === jointocreate && (!newChannel || newChannel.id !== jointocreate)) {
        if (members.length > 0) {
            let randomID = members[Math.floor(Math.random() * members.length)];
            let randomMember = guild.members.cache.get(randomID);

            randomMember.voice.setChannel(oldChannel).then(() => {
                oldChannel.setName(randomMember.user.username).catch(() => null);
                oldChannel.permissionOverwrites.edit(randomMember, { Connect: true, ManageChannels: true });
            });
            voiceManager.set(member.id, null);
            voiceManager.set(randomMember.id, oldChannel.id);
        } else {
            voiceManager.set(member.id, null);
            oldChannel.delete().catch(() => null);
        }
    }
};