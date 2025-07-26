const { MessageFlags } = require("discord.js");

module.exports = async function replyServiceAlreadyEnabledOrDisabled(interaction, service, enabled, alreadyEnabled = true) {
    try {
        const content = enabled === "disabled"
            ? `\`ℹ️\` The \`${service}\` service is already **DISABLED**. Please run \`/bot-set-service\` \`${service}\` and select **ENABLE** action to activate it.`
            : `\`ℹ️\` The \`${service}\` service is${alreadyEnabled ? " already" : ""} **ENABLED**. Please run \`/bot-set-service\` \`${service}\` and select **DISABLE** or **EDIT** action.`;

        if (interaction.isStringSelectMenu?.()) return await interaction.update({ content, components: [], flags: MessageFlags.Ephemeral });
        if (interaction.replied || interaction.deferred) return await interaction.editReply({ content, flags: MessageFlags.Ephemeral });
        else if (typeof interaction.update === "function") return await interaction.update({ content, components: [], flags: MessageFlags.Ephemeral });
        else return await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    } catch (err) {
        console.log("Error in replyServiceAlreadyEnabledOrDisabled:", err);

        const fallbackContent = `\`❌\` An unexpected error occurred while processing your request.`;
        try {
            if (interaction.replied || interaction.deferred) return await interaction.editReply({ content: fallbackContent, flags: MessageFlags.Ephemeral });
            else return await interaction.reply({ content: fallbackContent, flags: MessageFlags.Ephemeral });
        } catch { }
    }
}