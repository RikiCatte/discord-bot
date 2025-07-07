const { MessageFlags } = require("discord.js");

module.exports = async function replyServiceAlreadyEnabledOrDisabled(interaction, service, enabled, alreadyEnabled = true) {
    try {
        if (!interaction || !service || !enabled || (enabled !== "enabled" && enabled !== "disabled")) {
            console.log(`Invalid parameters provided to replyServiceAlreadyEnabledOrDisabled function. Check \`${service}\` service in botSetService.js`);
            return await interaction.reply({ content: "\`❌\` An error occurred while processing your request. Please contact DEVs and try again later.", flags: MessageFlags.Ephemeral });
        }

        return await interaction.reply({ content: `\`ℹ️\` The \`${service}\` service is${alreadyEnabled ? " already" : ""} ${enabled}. Please run \`/bot-set-service\` \`${service}\` and select *${enabled === "enabled" ? "Disable" : "Enable"}* or *Edit* action.`, flags: MessageFlags.Ephemeral });
    } catch (err) {
        console.log("Error in replyServiceAlreadyEnabledOrDisabled:", err);
        return await interaction.reply({ content: "\`❌\` An unexpected error occurred while processing your request. Please contact DEVs and try again later.", flags: MessageFlags.Ephemeral });
    }
}