const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js")
const BotConfig = require("../schemas/BotConfig");
const replyNoConfigFound = require("../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");
const updateServiceConfig = require("../utils/BotConfig/updateServiceConfig");

module.exports = {
    customId: "ban-sus-user",
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.suspicioususerjoin;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "suspicioususerjoin");
        if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "suspicioususerjoin", "disabled", false);

        const logsConfig = config?.services?.logs;
        if (!logsConfig || !logsConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "logs", "disabled", false);

        const logChannel = client.channels.cache.get(logsConfig.LogChannelID);
        if (!logChannel) return interaction.reply({ content: "`❌` Log channel not found, please check your Bot Config!", Flags: MessageFlags.Ephemeral });

        const { message } = interaction;

        const susUser = serviceConfig.SusUsers.find(user => user.MessageID === message.id);
        if (!susUser || !susUser.SusUserID) return interaction.reply({ content: "`❌` This user was not found in the DB", Flags: MessageFlags.Ephemeral });
        if (susUser.TakenAction) return interaction.reply({ content: "`❓` This user has already been processed by someone else", Flags: MessageFlags.Ephemeral });

        const member = await interaction.guild.members.fetch(susUser.SusUserID);

        try {
            await member.ban({ reason: `You have been banned from ${interaction.guild.name}` });
            await logChannel.send({ content: `User ${member} (${member.id}) has been **Banned** by ${interaction.user} (${interaction.user.id})` });
        } catch (err) {
            console.error(err);
            return await interaction.reply({ content: `Something went wrong while banning ${member}, maybe he has Admin Role`, Flags: MessageFlags.Ephemeral });
        }

        const disabledKickBtn = new ButtonBuilder()
            .setCustomId("kick-sus-user")
            .setLabel("🦶 Kick User")
            .setDisabled(true)
            .setStyle(ButtonStyle.Danger)

        const disabledBanBtn = new ButtonBuilder()
            .setCustomId("ban-sus-user")
            .setLabel("⛔ Ban User")
            .setDisabled(true)
            .setStyle(ButtonStyle.Danger)

        const disabledCancelBtn = new ButtonBuilder()
            .setCustomId("noaction-sus-user")
            .setLabel("🔰 Do Nothing")
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary)

        const disabledRow = new ActionRowBuilder().addComponents(disabledKickBtn, disabledBanBtn, disabledCancelBtn);

        await message.edit({ content: `\`✅\` This Security issue has been solved by ${interaction.user} (${interaction.user.id})`, components: [disabledRow] });

        susUser.TakenAction = true;
        susUser.Action = "User-Ban";
        susUser.ModeratedBy = interaction.user.id;

        await updateServiceConfig(config, "suspicioususerjoin", { SusUsers: serviceConfig.SusUsers });

        return await interaction.reply({ content: `\`✅\` ${member} (${member.id}) should have been successfully banned`, Flags: MessageFlags.Ephemeral });
    }
}