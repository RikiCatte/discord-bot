const path = require("path");
const { getAllFiles } = require("../utils/utils.js");

const DEBUG = false;

module.exports = (client) => {
    const eventFolders = getAllFiles(path.join(__dirname, "..", "events"), true);

    for (const eventFolder of eventFolders) {
        const eventFiles = getAllFiles(eventFolder);
        let eventName;
        eventName = eventFolder.replace(/\\/g, "/").split("/").pop();

        eventName === "validations" ? (eventName = "interactionCreate") : eventName;

        client.on(eventName, async (...arg) => {
            for (const eventFile of eventFiles) {
                try {
                    const eventFunction = require(eventFile);
                    await eventFunction(client, ...arg);
                    if (DEBUG) console.log(`Compiled event file: ${eventFile}`);
                } catch (error) {
                    console.error(`Error compiling event file ${eventFile}:`, error);
                }
            }
        });
    }
};