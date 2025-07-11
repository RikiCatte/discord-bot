const { MessageFlags } = require("discord.js");

module.exports = async function replyServiceNotEnabled(interaction, service) {
    return await interaction.reply({content: `\`⚠️\` The \`${service}\` service is not enabled. Before editing, please enable it using the \`/bot-set-service\` command.`, flags: MessageFlags.Ephemeral });
}