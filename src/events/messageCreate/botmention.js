const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const msgConfig = require("../../messageConfig.json");

module.exports = async (client, message) => {

    async function sendMessage(reply) {
        if (message.author.bot) return;

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle(msgConfig.botMentionEmbedTitle)
            .setDescription(msgConfig.botMentionEmbedDescription)
            .setTimestamp();

        if (!reply) {
            await message.reply({ embeds: [embed] });
        } else {
            embed.setFooter({ text: msgConfig.botMentionEmbedFooterText });

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("replymsgDelete")
                        .setLabel("🗑️")
                        .setStyle(ButtonStyle.Danger)
                );

            const msg = await message.reply({ embeds: [embed], components: [button] });
            const collector = await msg.createMessageComponentCollector();
            collector.on("collect", async i => {
                if (i.customId == "replymsgDelete") {
                    await msg.delete();
                }
            });
        }
    }

    if (message.mentions.users.first() == client.user) {
        if (message.reference) {
            await sendMessage(true);
        } else {
            await sendMessage();
        }
    }
}