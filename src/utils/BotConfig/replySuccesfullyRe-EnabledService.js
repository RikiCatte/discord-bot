const { MessageFlags } = require("discord.js");

module.exports = async function successfullyReEnabledService(interaction, service) {
    try {
        return await interaction.reply({ content: `\`▶️\` The service \`${service}\` has been successfully re-enabled and will use the existing configuration. If you want to change it, run \`/bot-set-service\` and use \`edit\` action`, flags: MessageFlags.Ephemeral });
    } catch (err) {
        console.log("Error in replySuccesfullyRe-EnabledService.js:", err);
        return await interaction.reply({ content: `\`❌\` An unexpected error occurred while processing your request.`, flags: MessageFlags.Ephemeral });
    }
}