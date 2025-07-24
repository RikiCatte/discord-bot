const { MessageFlags } = require("discord.js");

module.exports = async function replyServiceNotEnabled(interaction, service) {
    try {
        const content = `\`⚠️\` The \`${service}\` service is not **ENABLED**. Before proceeding, please enable it using \`/bot-set-service\` \`${service}\` \`enable\`.`

        if (interaction.isStringSelectMenu?.()) return await interaction.update({ content, components: [], flags: MessageFlags.Ephemeral });
        if (interaction.replied || interaction.deferred) return await interaction.editReply({ content, flags: MessageFlags.Ephemeral });
        else if (typeof interaction.update === "function") return await interaction.update({ content, components: [], flags: MessageFlags.Ephemeral });
        else return await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    } catch (err) {
        console.log("Error in replyServiceNotEnabled:", err);

        const fallbackContent = `\`❌\` An unexpected error occurred while processing your request.`;
        try {
            if (interaction.replied || interaction.deferred) return await interaction.editReply({ content: fallbackContent, flags: MessageFlags.Ephemeral });
            else return await interaction.reply({ content: fallbackContent, flags: MessageFlags.Ephemeral });
        } catch { }
    }
}