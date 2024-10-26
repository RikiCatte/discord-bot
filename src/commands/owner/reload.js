require("colors");
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const eventHandler = require('../../handlers/eventHandler');
const commandHandler = require("../../events/ready/registerCommands");
const CMhandler = require("../../events/ready/registerContextMenus");
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("reload")
        .setDescription("Reload Bot's commands and events.")
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    run: async (client, interaction) => {
        const { user } = interaction;

        const embed = new EmbedBuilder()
            .setTitle("💻 Developer")
            .setColor("Blue")
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.iconURL })
            .setTimestamp();

        try {
            eventHandler(client);
            commandHandler(client);
            CMhandler(client);
        } catch (err) {
            return interaction.reply("\`❌\` Something went wrong while reloading bot's command and events: " + err);
        }

        interaction.reply({ embeds: [embed.setDescription(`\`✅\` Commands, events and context menus have been reloaded! by ${user}`)] });
        console.log(`${user} has reloaded commands, events and context menus.`.magenta);
    }
}