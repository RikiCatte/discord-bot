const { MessageFlags } = require("discord.js");

module.exports = async function replyNoConfigFound(interaction, service) {
    try {
        const content = `\`❌\` There was an error while trying to retrieve the server config for \`${service}\`.`;

        if (interaction.isStringSelectMenu?.()) return await interaction.update({ content, components: [], flags: MessageFlags.Ephemeral });
        if (interaction.replied || interaction.deferred) return await interaction.editReply({ content, flags: MessageFlags.Ephemeral });
        else if (typeof interaction.update === "function") return await interaction.update({ content, components: [], flags: MessageFlags.Ephemeral });
        else return await interaction.reply({ content, flags: MessageFlags.Ephemeral });
    } catch (err) {
        console.log("Error in replyNoConfigFound:", err);

        const fallbackContent = `\`❌\` An unexpected error occurred while processing your request.`;
        try {
            if (interaction.replied || interaction.deferred) return await interaction.editReply({ content: fallbackContent, flags: MessageFlags.Ephemeral });
            else return await interaction.reply({ content: fallbackContent, flags: MessageFlags.Ephemeral });
        } catch { }
    }
}