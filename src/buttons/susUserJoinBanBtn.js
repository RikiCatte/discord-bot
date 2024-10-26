const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const susUserSchema = require("../schemas/suspiciousUserJoin");
const msgConfig = require("../messageConfig.json");

module.exports = {
    customId: "ban-sus-user",
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const logChannel = client.channels.cache.get(`${msgConfig.logsChannel}`);
        if (!logChannel) return interaction.reply({ content: "❌ Error occurred, please check .json file", ephemeral: true });

        const { message } = interaction;

        const susUser = await susUserSchema.findOne({ GuildID: interaction.guild.id, MessageID: message.id });
        if (!susUser || susUser.TakenAction) return interaction.reply({ content: "❌ This user was not found in the DB", ephemeral: true });

        if (interaction.customId && interaction.customId == "ban-sus-user") {
            const member = await interaction.guild.members.fetch(susUser.SusUserID);

            try {
                await member.ban({ reason: `You have been banned from ${interaction.guild.name}` });
                await logChannel.send({ content: `User ${member} (${member.id}) has been **Banned** by ${interaction.user} (${interaction.user.id})` });
            } catch (err) {
                console.error(err);
                return await interaction.reply({ content: `Something went wrong while banning ${member}, maybe he has Admin Role`, ephemeral: true });
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

            await message.edit({ content: `This Security issue has been solved by ${interaction.user} (${interaction.user.id})`, components: [disabledRow] });

            await susUserSchema.updateOne({ GuildID: interaction.guild.id, MessageID: message.id }, { TakenAction: true, Action: "User-Ban", ModeratedBy: interaction.user.id });

            return await interaction.reply({ content: `✅ ${member} (${member.id}) should have been successfully banned`, ephemeral: true });
        }
    }
}