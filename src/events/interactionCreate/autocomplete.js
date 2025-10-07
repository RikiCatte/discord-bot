const { getLocalCommands } = require("../../utils/utils.js");

module.exports = async (client, interaction) => {
    if (!interaction.isAutocomplete()) return;

    const localCommands = getLocalCommands();
    const commandObject = localCommands.find((cmd) => cmd.data.name === interaction.commandName);

    if (commandObject && commandObject.autocomplete) {
        let responded = false;
        const timeout = setTimeout(() => {
            if (!responded) {
                responded = true;
                interaction.respond([]).catch(() => { });
            }
        }, 2500);

        try {
            await commandObject.autocomplete(interaction, (hasResponded) => {
                clearTimeout(timeout);
                if (hasResponded) responded = true;
            });
        } catch (err) {
            clearTimeout(timeout);
            if (!responded) {
                responded = true;
                if (!err.message?.includes("Unknown interaction")) {
                    console.log("[AUTOCOMPLETE ERROR]", err);
                }
                await interaction.respond([]).catch(() => { });
            }
        }
    } else {
        await interaction.respond([]).catch(() => { });
    }
};