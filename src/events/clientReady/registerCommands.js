require("colors");

const commandComparing = require("../../utils/commandComparing");
const getApplicationCommands = require("../../utils/getApplicationCommands");
const getLocalCommands = require("../../utils/getLocalCommands");
var commandName;

const DEBUG = false;

module.exports = async function registerCommands(client) {
    try {
        const applicationCommands = await getApplicationCommands(client);

        // await applicationCommands.set([]); // Decomment to clear only global application commands in case of problems

        const localCommands = getLocalCommands();

        for (const localCommand of localCommands) {
            const { data } = localCommand;

            commandName = data.name;
            const commandDescription = data.description;
            const commandOptions = data.options;

            const existingCommand = await applicationCommands.cache.find(
                (cmd) => cmd.name === commandName
            );

            if (existingCommand) {
                if (localCommand.deleted) {
                    await applicationCommands.delete(existingCommand.id);
                    console.log(
                        `[COMMAND REGISTERY] Application command ${commandName} has been deleted.`.red
                    );
                    continue;
                }

                if (commandComparing(existingCommand, localCommand)) {
                    await applicationCommands.edit(existingCommand.id, {
                        name: commandName,
                        description: commandDescription,
                        options: commandOptions,
                    });
                    console.log(
                        `[COMMAND REGISTERY] Application command ${commandName} has been edited.`.yellow
                    );
                }

                if (DEBUG) console.log(`[COMMAND REGISTERY] Application command ${commandName} has been compiled.`.green);
            } else {
                if (localCommand.deleted) {
                    console.log(
                        `[COMMAND REGISTERY] Application command ${commandName} has been skipped, since property "deleted" is set to "true".`
                            .grey
                    );
                    continue;
                }

                await applicationCommands.create({
                    name: commandName,
                    description: commandDescription,
                    options: commandOptions,
                });
                console.log(
                    `[COMMAND REGISTERY] Application command ${commandName} has been registered.`.green
                );
            }
        }
    } catch (err) {
        console.log(`[COMMAND REGISTERY] - [ERROR] - An error occurred whit "${commandName}" command! Here it is the reason and location: `.red + `\n ${err.stack}`.yellow);
    }
};