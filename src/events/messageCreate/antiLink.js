const { Message } = require("discord.js");
const linkSchema = require("../../schemas/antiLink");
const linkSchemaWL = require("../../schemas/antiLinkWL");

/**
 * 
 * @param {Client} client 
 * @param {Message} message 
 * @returns 
 */
module.exports = async (client, message) => {
    if (!message.guild) return; // DM message

    if (message.content.startsWith("http") || message.content.includes("http") || message.content.startsWith("discord.gg")) {

        const data = await linkSchema.findOne({ Guild: message.guild.id });
        const userData = await linkSchemaWL.findOne({ Guild: message.guild.id, UserID: message.author.id });

        if (!data) return;

        const memberPerms = data.Permissions;

        const user = message.author;
        const member = message.guild.members.cache.get(user.id);

        if (member.permissions.has(memberPerms) || userData) return;

        await message.channel.send({ content: `${message.author}, you can't send links here!` }).then(msg => {
            setTimeout(() => msg.delete(), 3000)
        });

        await message.delete();
    }
}