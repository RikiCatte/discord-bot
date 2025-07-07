module.exports = async function successfullyDisabledService(interaction, service) {
    try {
        return await interaction.reply({ content: `\`⏸️\` Service \`${service}\` successfully disabled.`, flags: MessageFlags.Ephemeral });
    } catch (err) {
        console.log("Error in successfullyDisabledService:", err);
        return await interaction.reply({ content: `\`❌\` An unexpected error occurred while processing your request.`, flags: MessageFlags.Ephemeral });
    }
}