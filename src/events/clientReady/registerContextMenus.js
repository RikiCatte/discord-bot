require("colors");

const { getApplicationCommands, getLocalContextMenus } = require("../../utils/utils.js");

module.exports = async (client) => {
	try {
		const localContextMenus = getLocalContextMenus();
		const applicationContextMenus = await getApplicationCommands(client);

		for (const localContextMenu of localContextMenus) {
			const { data } = localContextMenu;

			const contextMenuName = data.name;
			const contextMenuType = data.type;

			const existingContextMenu = await applicationContextMenus.cache.find((cmd) => cmd.name === contextMenuName);

			if (existingContextMenu) {
				if (localContextMenu.deleted) {
					await applicationContextMenus.delete(existingContextMenu.id);
					console.log(`[CONTEXT MENUS REGISTERY] Application command ${contextMenuName} has been deleted.`.red);
					continue;
				};
			} else {
				if (localContextMenu.deleted) {
					console.log(`[CONTEXT MENUS REGISTERY] Application command ${contextMenuName} has been skipped, since property "deleted" is set to "true".`.grey);
					continue;
				};

				await applicationContextMenus.create({ name: contextMenuName, type: contextMenuType });
				console.log(`[CONTEXT MENUS REGISTERY] Application command ${contextMenuName} has been registered.`.green);
			};
		};
	} catch (err) {
		console.log(`[ERROR] - An error occurred inside the command registry! Here it is the reason and location: `.red + `\n ${err.stack}`.yellow);
	};
};