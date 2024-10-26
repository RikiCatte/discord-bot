const greetingSchema = require("../../schemas/greeting");
const { profileImage } = require("discord-arts");
const { EmbedBuilder, GuildMember } = require("discord.js");
const msgConfig = require("../../messageConfig.json");

/**
 * 
 * @param {Client} client 
 * @param {GuildMember} member 
 * @returns 
 */
module.exports = async (client, member) => {
    const data = await greetingSchema.findOne({ GuildID: member.guild.id });

    if (!data || (data && data.Welcome.Enabled === false)) return;

    const channel = member.guild.channels.cache.get(data.Welcome.ChannelID);
    if (!channel) return;

    const message = data.Welcome.Message.replace("<user>", member.user.username);

    try {
        const image = await profileImage(member.user.id, {
            borderColor: data.Welcome.BorderColor,
            customTag: message,
            customDate: new Date().toLocaleDateString()
        });

        await channel.send({ content: `${member} Welcome and have fun on our server, read the rules and if you need support don't hesitate to ask!`, files: [image] });
    }
    catch (error) { // if discord-arts API is down
        const { guild } = member;

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`**${msgConfig.welcomeEmbedTitle}**`)
            .setAuthor({ name: client.user.username, iconURL: msgConfig.welcomeEmbedAuthorIconURL })
            .setThumbnail(msgConfig.welcomeEmbedThumbnail)
            .setColor(msgConfig.welcomeEmbedColor)
            .addFields({ name: "Stai attento ai meloni!", value: `<@${member.id}>`, inline: true })
            .addFields({ name: 'Colonie totali: ', value: `${guild.memberCount}`, inline: true })  //<@${member.id}>
            .setTimestamp()
            .setFooter({ text: msgConfig.welcomeEmbedFooterText, iconURL: msgConfig.welcomeEmbedFooterIconURL });

        return await channel.send({ content: `${member} Welcome and have fun on our server, read the rules and if you need support don't hesitate to ask!`, embeds: [welcomeEmbed] });
    }
}
