const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("boost-check")
        .setDescription("Shows the current boost event setup"),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    run: async (client, interaction) => {
        try {
            const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
            const serviceConfig = config?.services?.nitroboost;

            if (!serviceConfig) return await replyNoConfigFound(interaction, "boost");
            if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "boost", "disabled", false);

            const embed = new EmbedBuilder()
                .setTitle(serviceConfig.embedTitle || "Boost Setup")
                .setColor(serviceConfig.embedColor || "#5865F2")
                .setDescription(serviceConfig.embedMessage || "No embed message configured.")
                .addFields(
                    { name: "Boost Channel", value: serviceConfig.channelID ? `${serviceConfig.channelID}` : "Not Configured.", inline: true },
                    { name: "Boost Message", value: serviceConfig.boostMessage || "Not Configured.", inline: false }
                );

            await interaction.reply({ content: "\`🔧\` Here is the current configuration of the boost system:", embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (err) {
            console.log(err);
            return await interaction.reply({ content: `\`❌\` An unexpected error occurred while processing your request.`, flags: MessageFlags.Ephemeral });
        }
    }
}