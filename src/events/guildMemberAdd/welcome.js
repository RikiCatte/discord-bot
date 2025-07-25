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

    if (!serviceConfig || !serviceConfig.enabled || serviceConfig.Welcome.Enabled !== true) return;

    const channel = member.guild.channels.cache.get(serviceConfig.Welcome.ChannelID);
    if (!channel) return;

    const message = serviceConfig.Welcome.Message.replace("<user>", member.user.username);
    const replyMessage = serviceConfig.Welcome.ReplyMessage
        ? serviceConfig.Welcome.ReplyMessage.replace("<user>", member.user)
        : "";

    let borderColor = serviceConfig.Welcome.BorderColor || "#FFFFFF";
    if (borderColor.toLowerCase() === "random") borderColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

    try {
        const image = await profileImage(member.user.id, {
            presenceStatus: serviceConfig.Welcome.PresenceStatus || "online",
            borderColor: borderColor,
            customTag: message || "Hey! <user>",
            customDate: new Date().toLocaleDateString(),
            customBackground: member.user.bannerURL({ forceStatic: true })
        });

        await channel.send({ content: replyMessage, files: [image] });
    }
    catch (error) {
        console.log("[welcome.js] Error while intercepting guildMemberAdd event: ", error, "\nMake sure you have installed discord-arts package!");
    }
}
