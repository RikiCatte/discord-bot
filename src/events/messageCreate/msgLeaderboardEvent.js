const lb = require("../../schemas/msgleaderboard");

module.exports = async (client, message) => {
    if (message.author.bot) return;

    var data = await lb.findOne({ Guild: message.guild.id, USer: message.author.id });
    if (!data) {
        await lb.create({
            Guild: message.guild.id,
            User: message.author.id,
            Messages: 1
        });
    } else {
        var updatedMessage = data.Messages + 1;
        await lb.deleteOne({ Guild: message.guild.id, User: message.author.id });
        await lb.create({ Guild: message.guild.id, User: message.author.id, Messages: updatedMessage });
    }
}