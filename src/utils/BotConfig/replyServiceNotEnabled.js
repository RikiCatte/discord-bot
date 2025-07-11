const { MessageFlags } = require("discord.js");

module.exports = async function replyServiceNotEnabled(interaction, service) {
    return await interaction.reply({content: `\`⚠️\` The \`${service}\` service is not enabled. Before proceeding, please enable it using \`/bot-set-service\` \`${service}\` \`enable\`.`, flags: MessageFlags.Ephemeral });
}