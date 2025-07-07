module.exports = async function handleSelectMenuInteraction(interaction, customId, timeout = 60000, timeEndMessage = "\`⏰\` Time is up! Please run the command again.") {
    const filter = i => i.customId === customId && i.user.id === interaction.user.id;
    try {
        const select = await interaction.channel.awaitMessageComponent({ filter, time: timeout });
        return { success: true, select };
    } catch (err) {
        await interaction.editReply({ content: `${timeEndMessage}`, components: [] });
        return { success: false };
    }
}