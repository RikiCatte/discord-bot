const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js")
const susUserSchema = require("../schemas/suspiciousUserJoin");
const msgConfig = require("../messageConfig.json");

module.exports = {
    customId: "noaction-sus-user",
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const logChannel = client.channels.cache.get(`${msgConfig.logsChannel}`);
        if (!logChannel) return interaction.reply({ content: "❌ Error occurred, please check .json file", Flags: MessageFlags.Ephemeral });

        const { message } = interaction;

        const susUser = await susUserSchema.findOne({ GuildID: interaction.guild.id, MessageID: message.id });
        if (!susUser || susUser.TakenAction) return interaction.reply({ content: "❌ This user was not found in the DB", Flags: MessageFlags.Ephemeral });

        if (interaction.customId && interaction.customId == "noaction-sus-user") {
            const member = await interaction.guild.members.fetch(susUser.SusUserID);


            await logChannel.send({ content: `User ${member} (${member.id}) has been **Ignored** by ${interaction.user} (${interaction.user.id})` });

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

            await message.edit({ content: `This Security issue has been solved by ${interaction.user} (${interaction.user.id})`, components: [disabledRow] });

            await susUserSchema.updateOne({ GuildID: interaction.guild.id, MessageID: message.id }, { TakenAction: true, Action: "Ignored", ModeratedBy: interaction.user.id });

            return await interaction.reply({ content: `✅ ${member} (${member.id}) has been ignored`, Flags: MessageFlags.Ephemeral });
        }
    }
}