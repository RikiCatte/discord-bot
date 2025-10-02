const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");
const shuffleParticipants = require("./shuffleParticipants");

module.exports = async function checkGiveaways(client, config) {
    try {
        const serviceConfig = config?.services?.giveaway;
        if (!config || !serviceConfig?.enabled) return;

        const giveaways = serviceConfig?.giveaways || [];

        giveaways.forEach(async (giveaway) => {
            const now = new Date().getTime();

            let message;
            if (now >= giveaway.EndTimestamp || giveaway.Ended || giveaway.Paused) {
                const channel = client.channels.cache.get(giveaway.ChannelID);
                message = await channel.messages.fetch(giveaway.MessageID).catch(() => { return; });
            } else return; // Giveaway isn't expired yet

            if (giveaway.Ended || giveaway.Paused) return;

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("-")
                    .setLabel("🎉")
                    .setDisabled(true)
                    .setStyle(ButtonStyle.Primary)
            );

            let shuffledParticipants = shuffleParticipants(giveaway.Participants.slice());
            const winners = shuffledParticipants.slice(0, giveaway.WinnerCount);

            if (!winners.length) {
                const embed = new EmbedBuilder()
                    .setTitle("`🛑` Giveaway ended")
                    .setDescription(`This giveaway ended <t:${Math.floor(giveaway.EndTimestamp / 1000)}:R>`)
                    .addFields(
                        { name: "`🙋` Entries", value: `\`${giveaway.Participants.length}\``, inline: true },
                        { name: "`🏆` Winners", value: "*No one entered the giveaway*", inline: true }
                    )
                    .setColor("White");

                let endMessage;
                try {
                    endMessage = await message.edit({ embeds: [embed], components: [row] });
                    endMessage.reply("*Giveaway ended, but no one joined the giveaway.*");
                    giveaway.Ended = true;
                    await updateServiceConfig(config, "giveaway", { giveaways: serviceConfig.giveaways });
                } catch (e) { }
            } else {
                const mentions = winners.map((winner) => `<@${winner}>`).join(", ");
                const embed = new EmbedBuilder()
                    .setTitle("`🛑` Giveaway ended")
                    .setDescription(`This giveaway ended <t:${Math.floor(giveaway.EndTimestamp / 1000)}:R>`)
                    .addFields(
                        { name: "`🙋` Entries", value: `\`${giveaway.Participants.length}\``, inline: true },
                        { name: "`🏆` Winners", value: `${mentions}`, inline: true }
                    )
                    .setColor("White");

                try {
                    const endMessage = await message.edit({ embeds: [embed], components: [row] });
                    endMessage.reply({ content: `Congratulations ${mentions}! You won the **${giveaway.Prize}** giveaway!` });
                    giveaway.Ended = true;
                    giveaway.Winners = winners;
                    await updateServiceConfig(config, "giveaway", { giveaways: serviceConfig.giveaways });
                } catch (e) { }
            }
        });
    } catch (error) {
        console.log(error);
    }
}