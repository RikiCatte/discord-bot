const { StringSelectMenuBuilder, ActionRowBuilder, ComponentType, MessageFlags } = require("discord.js");

module.exports = async function promptConfigType(interaction, service, configTypes) {
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("configTypeSelect")
        .setPlaceholder("Select configuration type")
        .addOptions(configTypes.map(type => ({ label: type, value: type })));

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: `\`🔧\` Select which configuration you want to set up for **${service.toUpperCase()}** service:`,
        components: [row],
        flags: MessageFlags.Ephemeral
    });

    const filter = i => i.user.id === interaction.user.id;
    const collected = await interaction.channel.awaitMessageComponent({ filter, componentType: ComponentType.StringSelect, time: 60_000 });
    return { configType: collected.values[0], selectInteraction: collected };
}