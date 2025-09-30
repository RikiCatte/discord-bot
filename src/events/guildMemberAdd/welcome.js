const BotConfig = require("../../schemas/BotConfig");
const { profileImage } = require("discord-arts");
const { Client, GuildMember, EmbedBuilder } = require("discord.js");

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

    let title = serviceConfig.Welcome.EmbedTitle || `\`👋\` Welcome ${member.user.username}!`;
    title = title.replace(/<user>/g, member.user.username);
    
    let description = serviceConfig.Welcome.EmbedDescription || `We're glad to have you here!`;
    description = description
        .replace(/<rules>\((\d{18,19})\)/g, '<#$1>')
        .replace(/<help>\((\d{18,19})\)/g, '<#$1>')
        .replace(/<social>\((\d{18,19})\)/g, '<#$1>')
        .replace(/\\n/g, "\n")
        .replace(/\n/g, "\n")
        .replace(/<user>/g, member.user.username);

    const message = serviceConfig.Welcome.Message.replace("<user>", member.user.username);
    const replyMessage = serviceConfig.Welcome.ReplyMessage
        ? serviceConfig.Welcome.ReplyMessage.replace("<user>", member.user)
        : "";

    let borderColor = serviceConfig.Welcome.BorderColor || "#FFFFFF";
    if (borderColor.toLowerCase() === "random") borderColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

    let sent = false;
    try {
        const image = await profileImage(member.user.id, {
            presenceStatus: serviceConfig.Welcome.PresenceStatus || "online",
            borderColor: borderColor,
            customTag: message || "Hey! <user>",
            customDate: new Date().toLocaleDateString(),
            customBackground: member.user.bannerURL({ forceStatic: true })
        });

        await channel.send({ content: replyMessage + "\n\n" + description, files: [image] });
        sent = true;
    } catch (error) { /* discord-arts failed, fallback to embed. */ }
    if (!sent) {
        try {
            const doubledDescription = description.replace(/\n/g, "\n\n");

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(doubledDescription)
                .setThumbnail(member.user.displayAvatarURL())
                .setColor(borderColor || "#ebef00ff");

            await channel.send({
                content: replyMessage || null,
                embeds: [embed],
            });
        } catch (fallbackError) {
            console.error("[welcome.js] Fallback embed failed:", fallbackError);
        }
    }
};
