const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, PermissionFlagsBits } = require("discord.js")
const BotConfig = require("../schemas/BotConfig");
const replyNoConfigFound = require("../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");
const updateServiceConfig = require("../utils/BotConfig/updateServiceConfig");

module.exports = {
    customId: "logSystem",
    userPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

    run: async (client, interaction) => {
        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.logs;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "logs");
        if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "logs", "disabled", false);

        const { message } = interaction;

        const log = serviceConfig.RiskyLogs.find(log => log.RiskyLogID === message.id);
        if (!log) return interaction.reply({ content: "`❌` Log not found in DB", Flags: MessageFlags.Ephemeral });
        if (log.Solved) return interaction.reply({ content: "`❓` This log has already been marked as solved.", Flags: MessageFlags.Ephemeral });

        log.Solved = true;
        log.SolvedBy = interaction.user.id;
        await updateServiceConfig(config, "logs", { RiskyLogs: serviceConfig.RiskyLogs });


        const disabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`logSystem`)
                .setStyle(ButtonStyle.Success)
                .setDisabled(true)
                .setLabel("✅ Mark as Solved")
        );
        message.edit({ content: `\`✅\` This Security issue has been marked solved by ${interaction.user} (${interaction.user.id})`, components: [disabledRow] });

        return await interaction.reply({ content: "`✅` Log Marked as Fixed", Flags: MessageFlags.Ephemeral });
    },
};