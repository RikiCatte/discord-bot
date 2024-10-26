const DEBUG = false;

module.exports = async function handleEvent(client, eventName, executeFunction) {
    client.on(eventName, async (arg) => {
        try {
            await executeFunction(client, arg);

            if (DEBUG) console.log(`[EVENT REGISTRY] Event ${eventName} has been compiled`.blue);
        } catch (error) {
            console.error(`[EVENT REGISTRY] Error in compiling event ${eventName}: ${error.message}`.red);
        }
    });
};
