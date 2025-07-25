const BotConfig = require("../../schemas/BotConfig");
const { profileImage } = require("discord-arts");
const { Client, GuildMember } = require("discord.js");

/**
 * 
 * @param {Client} client 
 * @param {GuildMember} member 
 * @returns 
 */
module.exports = async (client, member) => {
    const config = await BotConfig.findOne({ GuildID: member.guild.id });
    const serviceConfig = config?.services?.greeting;

    if (!serviceConfig || !serviceConfig.enabled || serviceConfig.Goodbye.Enabled !== true) return;

    const channel = member.guild.channels.cache.get(serviceConfig.Goodbye.ChannelID);
    if (!channel) return;

    const message = serviceConfig.Goodbye.Message.replace("<user>", member.user.username);
    const replyMessage = serviceConfig.Goodbye.ReplyMessage
        ? serviceConfig.Goodbye.ReplyMessage.replace("<user>", member.user)
        : "";

    let borderColor = serviceConfig.Goodbye.BorderColor || "#FFFFFF";
    if (borderColor.toLowerCase() === "random") borderColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

    try {
        const image = await profileImage(member.user.id, {
            presenceStatus: serviceConfig.Goodbye.PresenceStatus || "online",
            borderColor: borderColor,
            customTag: message || "Bye! <user>",
            customDate: new Date().toLocaleDateString(),
            customBackground: member.user.bannerURL({ forceStatic: true })
        });

        await channel.send({ content: replyMessage, files: [image] });
    }
    catch (error) {
        console.log("[goodbye.js] Error while intercepting guildMemberRemove event: ", error, "\nMake sure you have installed discord-arts package!");
    }
}