const getLocalCommands = require("../../utils/getLocalCommands");

module.exports = async (client, interaction) => {
    if (!interaction.isAutocomplete()) return;

    const localCommands = getLocalCommands();
    const commandObject = localCommands.find((cmd) => cmd.data.name === interaction.commandName);

    if (commandObject && commandObject.autocomplete) {
        try {
            await commandObject.autocomplete(interaction);
        } catch (err) {
            console.log("[AUTOCOMPLETE ERROR]", err);
            await interaction.respond([]); // Reply anyway to avoid timeout
        }
    } else {
        await interaction.respond([]); // Reply anyway to avoid timeout
    }
};