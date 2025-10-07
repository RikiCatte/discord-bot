require("colors");

const { EmbedBuilder, MessageFlags } = require("discord.js");
const { developersId } = require("../../config.json");
const mConfig = require("../../messageConfig.json");
const { getButtons } = require("../../utils/utils.js");

module.exports = async (client, interaction) => {
    if (!interaction.isButton()) return;
    const buttons = getButtons();

    try {
        var buttonObject = buttons.find((btn) => btn.customId === interaction.customId); // -> ORIGINAL WAY TO FIND THE RIGHT BUTTON

        if (!buttonObject) { // -> If statement added to implement Bug Report System
            try {
                buttonObject = buttons.find((btn) => btn.customId.includes("bugSolved"));
            } catch { return interaction.reply({ content: "Please contact DEVs: Error in buttonValidator.js", flags: MessageFlags.Ephemeral }) };
        }

        if (!buttonObject) return interaction.reply({ content: "Something went wrong while validating this button, please contact DEVs", flags: MessageFlags.Ephemeral });

        if (buttonObject.devOnly) {
            if (!developersId.includes(interaction.member.id)) {
                const rEmbed = new EmbedBuilder()
                    .setColor(`${mConfig.embedColorError}`)
                    .setDescription(`${mConfig.commandDevOnly}`);
                interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
                return;
            };
        };

        if (buttonObject.userPermissions?.length) {
            for (const permission of buttonObject.userPermissions) {
                if (interaction.member.permissions.has(permission)) {
                    continue;
                };
                const rEmbed = new EmbedBuilder()
                    .setColor(`${mConfig.embedColorError}`)
                    .setDescription(`${mConfig.userNoPermissions}`);
                interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
                return;
            };
        };

        if (buttonObject.botPermissions?.length) {
            for (const permission of buttonObject.botPermissions) {
                const bot = interaction.guild.members.me;
                if (bot.permissions.has(permission)) {
                    continue;
                };
                const rEmbed = new EmbedBuilder()
                    .setColor(`${mConfig.embedColorError}`)
                    .setDescription(`${mConfig.botNoPermissions}`);
                interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
                return;
            };
        };

        if (interaction.message.interaction) {
            if (interaction.message.interaction.user.id !== interaction.user.id) {
                const rEmbed = new EmbedBuilder()
                    .setColor(`${mConfig.embedColorError}`)
                    .setDescription(`${mConfig.cannotUseButton}`);
                interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
                return;
            };
        };

        await buttonObject.run(client, interaction);
    } catch (err) {
        console.log(`An error occurred! ${err}`.red);
    };
};