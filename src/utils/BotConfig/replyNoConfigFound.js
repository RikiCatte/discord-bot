const { MessageFlags } = require("discord.js");

module.exports = async function replyNoConfigFound(interaction, service) {
    try {
        return await interaction.reply({ content: `\`❌\` There was an error while trying to retrieve the server config for \`${service}\`. service`, flags: MessageFlags.Ephemeral });
    } catch (err) {
        console.log("Error in replyNoConfigFound:", err);
        return await interaction.reply({ content: `\`❌\` An unexpected error occurred while processing your request.`, flags: MessageFlags.Ephemeral });
    }
}