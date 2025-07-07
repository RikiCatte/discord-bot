const { Message } = require("discord.js");
const botConfigCache = require("../../utils/BotConfig/botConfigCache");
const antiLinkWL = require("../../schemas/antiLinkWL");

/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 * @returns 
 */
module.exports = async (client, message) => {
    if (!message.guild) return; // DM message

    if (message.content.includes("http") || message.content.includes("discord.gg")) {
        const config = await botConfigCache.getConfig(message.guild.id);
        const serviceConfig = config?.services?.antilink;

        if (!serviceConfig || !serviceConfig.enabled) return;

        const bypassPermission = serviceConfig.Permissions;
        if (!bypassPermission) return;

        const userData = await antiLinkWL.findOne({ Guild: message.guild.id, UserID: message.author.id });
        if (userData) return;

        const member = message.guild.members.cache.get(message.author.id);
        if (member && member.permissions.has(bypassPermission)) return;

        await message.channel.send({ content: `${message.author}, you can't send links here!` }).then(msg => {
            setTimeout(() => msg.delete(), 3000)
        });

        await message.delete();
    }
}