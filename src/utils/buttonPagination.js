const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, MessageFlags } = require("discord.js");

module.exports = async (interaction, pages, time = 30 * 1000) => {
    try {
        if (!interaction || !pages || !pages.length > 0) throw new Error("Invalid arguments");

        await interaction.deferReply();

        if (pages.length === 1) {
            return await interaction.editReply({
                embeds: pages,
                components: [],
                fetchReply: true
            });
        }

        const prev = new ButtonBuilder()
            .setCustomId("pg-prev")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);

        const home = new ButtonBuilder()
            .setCustomId("pg-home")
            .setEmoji('🏠')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const next = new ButtonBuilder()
            .setCustomId("pg-next")
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Primary);

        const buttons = new ActionRowBuilder().addComponents([prev, home, next]);
        let index = 0;

        const msg = await interaction.editReply({
            embeds: [pages[index]],
            components: [buttons],
            fetchReply: true
        });

        const mc = await msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time,
        });

        mc.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) return await i.reply({ content: "You are not allowed to do this!", flags: MessageFlags.Ephemeral });

            await i.deferUpdate();

            if (i.customId === "pg-prev") {
                if (index > 0) {
                    index--;
                }
            } else if (i.customId === "pg-home") {
                index = 0;
            } else if (i.customId === "pg-next") {
                if (index < pages.length - 1) {
                    index++;
                }
            }

            prev.setDisabled(index === 0);
            home.setDisabled(index === 0);
            next.setDisabled(index === pages.length - 1);

            await msg.edit({
                embeds: [pages[index]],
                components: [buttons],
            });

            mc.resetTimer();
        });

        mc.on("end", async () => {
            await msg.edit({
                embeds: [pages[index]],
                components: [],
            });
        });

        return msg;
    } catch (err) {
        console.log(err);
    }
};