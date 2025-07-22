const { MessageFlags } = require("discord.js");
const BotConfig = require("../schemas/BotConfig");

module.exports = {
    customId: "giveawayBtn",
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const { message, user, guild } = interaction;

        const config = await BotConfig.findOne({ GuildID: guild.id });
        if (!config || !config.services.giveaway?.giveaways) return interaction.reply({ content: "`⚠️` This giveaway was not found in the database.", flags: MessageFlags.Ephemeral });

        const giveaway = config.services.giveaway.giveaways.find(g => g.MessageID === message.id);
        if (!giveaway) return interaction.reply({ content: "`⚠️` This giveaway was not found in the database.", flags: MessageFlags.Ephemeral });

        let embed = message.embeds[0];
        let fieldValueData = embed.data.fields[0].value;
        let entries = parseInt(fieldValueData.replace(/`/g, ""));

        if (giveaway.Participants.includes(user.id)) {
            giveaway.Participants = giveaway.Participants.filter((id) => id !== user.id);
            entries = Math.max(0, entries - 1);
            embed.data.fields[0].value = `\`${entries}\``;
            await message.edit({ embeds: [embed] });
            await config.save();
            return interaction.reply({ content: "`🚪` You have left the giveaway!", flags: MessageFlags.Ephemeral });
        }

        giveaway.Participants.push(user.id);
        entries = entries + 1;
        embed.data.fields[0].value = `\`${entries}\``;
        await message.edit({ embeds: [embed] });
        await config.save();
        return interaction.reply({ content: "`✅` You have successfully entered the giveaway!", flags: MessageFlags.Ephemeral });
    }
}