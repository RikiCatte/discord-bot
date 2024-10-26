const giveawaySchema = require("../schemas/giveaways");

module.exports = {
    customId: "giveawayBtn",
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const { message, user } = interaction;

        const giveaway = await giveawaySchema.findOne({ MessageID: message.id });
        if (!giveaway) return interaction.reply({ content: "This giveaway does not exist!", ephemeral: true });

        if (giveaway.Participants.includes(user.id)) {
            giveaway.Participants = giveaway.Participants.filter((id) => id != user.id);
            await giveaway.save().catch((err) => console.log(err));

            let embed = message.embeds[0];
            let fieldValueData = embed.data.fields[0].value;

            fieldValueData = `\`${parseInt(fieldValueData.replace("`", "")) - 1}\``;
            embed.data.fields[0].value = fieldValueData;

            message.edit({ embeds: [embed] });

            return interaction.reply({ content: "You have left the giveaway!", ephemeral: true });
        }

        giveaway.Participants.push(user.id);
        let embed = message.embeds[0];
        let fieldValueData = embed.data.fields[0].value;

        fieldValueData = `\`${parseInt(fieldValueData.replace("`", "")) + 1}\``;
        embed.data.fields[0].value = fieldValueData;

        message.edit({ embeds: [embed] });

        await giveaway.save().catch((err) => console.log(err));

        return interaction.reply({ content: "You have succesfully entered the giveaway!", ephemeral: true });
    }
}