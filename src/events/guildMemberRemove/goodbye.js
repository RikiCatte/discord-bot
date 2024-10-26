const greetingSchema = require("../../schemas/greeting");
const { profileImage } = require("discord-arts");

module.exports = async (client, member) => {
    const data = await greetingSchema.findOne({ GuildID: member.guild.id });

    if (!data || (data && data.Goodbye.Enabled === false)) return;

    const channel = member.guild.channels.cache.get(data.Goodbye.ChannelID);
    if (!channel) return;

    const message = data.Goodbye.Message.replace("<user>", member.user.username);

    const image = await profileImage(member.user.id, {
        borderColor: data.Goodbye.BorderColor,
        customTag: message,
        customDate: new Date().toLocaleDateString()
    });

    await channel.send({ content: `${member} Goodbye!`, files: [image] }).catch((err) => { console.error(err) });
}