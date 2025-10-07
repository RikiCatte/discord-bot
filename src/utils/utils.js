const {
    ActionRowBuilder,
    ApplicationCommand,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    Client,
    ComponentType,
    CommandInteraction,
    EmbedBuilder,
    MessageFlags,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const msgConfig = require("../messageConfig.json");
/**
 * Create the embed and components for the ticket system.
 * @param {Object} setup - TicketSetup document from the DB
 * @param {Object} client - Discord client instance
 * @param {Boolean} [disabled=false] - If true, disables the menu
 * @returns {Object} { embed, components }
 */
function buildTicketEmbed(setup, client, disabled = false) {
    const embed = new EmbedBuilder()
        .setColor(setup.EmbedColor || "#5865F2")
        .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img })
        .setThumbnail(msgConfig.thumbnail)
        .setDescription(setup.Description || "No description provided.")
        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

    const categories = setup.TicketCategories || [];
    const emojis = setup.Emojis || [];
    const options = categories.map((category, index) => {
        const emoji = emojis[index % emojis.length] || "";
        return new StringSelectMenuOptionBuilder()
            .setLabel(category)
            .setValue(category)
            .setDescription(`Create a ${category} Type Ticket.`)
            .setEmoji(emoji);
    });

    const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket-stringMenu")
        .setPlaceholder("Select a Category to Create a Ticket")
        .setDisabled(disabled)
        .addOptions(options);

    const components = [new ActionRowBuilder().addComponents(menu)];

    return { embed, components };
}

/**
 * Simple button-based pagination for an array of embeds.
 * @param {CommandInteraction} interaction 
 * @param {Array} pages 
 * @param {Number} time 
 * @returns 
 */
async function buttonPagination(interaction, pages, time = 30 * 1000) {
    try {
        if (!interaction || !pages || !pages.length > 0) throw new Error("Invalid arguments");

        await interaction.deferReply();

        if (pages.length === 1) {
            return await interaction.editReply({
                embeds: pages,
                components: [],
                fetchReply: true
            });
        }

        const prev = new ButtonBuilder()
            .setCustomId("pg-prev")
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);

        const home = new ButtonBuilder()
            .setCustomId("pg-home")
            .setEmoji('🏠')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const next = new ButtonBuilder()
            .setCustomId("pg-next")
            .setEmoji('➡️')
            .setStyle(ButtonStyle.Primary);

        const buttons = new ActionRowBuilder().addComponents([prev, home, next]);
        let index = 0;

        const msg = await interaction.editReply({
            embeds: [pages[index]],
            components: [buttons],
            fetchReply: true
        });

        const mc = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time,
        });

        mc.on("collect", async (i) => {
            if (i.user.id !== interaction.user.id) return await i.reply({ content: "You are not allowed to do this!", flags: MessageFlags.Ephemeral });

            await i.deferUpdate();

            if (i.customId === "pg-prev") if (index > 0) index--;
            else if (i.customId === "pg-home") index = 0;
            else if (i.customId === "pg-next") if (index < pages.length - 1) index++;

            prev.setDisabled(index === 0);
            home.setDisabled(index === 0);
            next.setDisabled(index === pages.length - 1);

            await msg.edit({
                embeds: [pages[index]],
                components: [buttons],
            });

            mc.resetTimer();
        });

        mc.on("end", async () => {
            try {
                await msg.fetch();
            } catch (err) { return; } // message deleted before collector end

            try {
                await msg.edit({
                    embeds: [pages[index]],
                    components: [],
                });
            } catch (err) {
                console.log("Error editing message: ", err);
            }
        });

        return msg;
    } catch (err) {
        console.log(err);
    }
};

/**
 * Compares two command objects to determine if they are different.
 * @param {Object} existing 
 * @param {Object} local 
 * @returns {Boolean} - true/false
 */
function commandComparing(existing, local) {
    const changed = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

    if (changed(existing.name, local.data.name) || changed(existing.description || undefined, local.data.description || undefined)) return true;

    const optionsChanged = changed(
        optionsArray(existing),
        optionsArray(local.data)
    );

    return optionsChanged;

    function optionsArray(cmd) {
        const cleanObject = (obj) => {
            for (const key in obj) {
                if (typeof obj[key] === "object") {
                    cleanObject(obj[key]);
                    if (!obj[key] || (Array.isArray(obj[key]) && !obj[key].length)) delete obj[key];
                } else if (obj[key] === undefined) delete obj[key];
            };
        };

        const normalizeObject = (input) => {
            if (Array.isArray(input)) return input.map((item) => normalizeObject(item));

            const normalizedItem = {
                type: input.type,
                name: input.name,
                description: input.description,
                options: input.options ? normalizeObject(input.options) : undefined,
                required: input.required,
                autocomplete: input.autocomplete,
            };

            return normalizedItem;
        };

        return (cmd.options || []).map((option) => {
            let cleanedOption = JSON.parse(JSON.stringify(option));
            cleanedOption.options
                ? (cleanedOption.options = normalizeObject(cleanedOption.options))
                : (cleanedOption = normalizeObject(cleanedOption));
            cleanObject(cleanedOption);
            return {
                ...cleanedOption,
                choices: cleanedOption.choices
                    ? stringifyChoices(cleanedOption.choices)
                    : null,
            };
        });
    };

    function stringifyChoices(choices) {
        return JSON.stringify(choices.map((c) => c.value));
    };
};

const { PermissionsBitField } = require("discord.js");
/**
 * Function to format permissions bitfield to human-readable permissions
 * @param {PermissionsBitField | bigint} bitfield 
 * @returns {string} - A string containing the human-readable permissions splitted by commas
 */
function formatPermissions(bitfield) {
    const permissions = new PermissionsBitField(bitfield);
    return permissions.toArray().join(', ');
}

/**
 * Returns the current date formatted as DD/MM/YYYY HH:MM:SS
 * @returns {string} - Formatted date string, e.g. "07/10/2025 14:23:45"
 */
function formattedDate() {
    const currentDate = new Date();

    let day = currentDate.getDate().toString().padStart(2, '0');
    let month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // +1 cause months in JS start from 0
    let year = currentDate.getFullYear();
    let hours = currentDate.getHours().toString().padStart(2, '0');
    let minutes = currentDate.getMinutes().toString().padStart(2, '0');
    let seconds = currentDate.getSeconds().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Converts milliseconds to a human-readable format
 * @param {Number} msValue 
 * @returns {String} - Human-readable time format
 */
function formattedMsToSecs(msValue) {
    const seconds = Math.floor((msValue / 1000) % 60);
    const minutes = Math.floor((msValue / (1000 * 60)) % 60);
    const hours = Math.floor((msValue / (1000 * 60 * 60)) % 24);
    const days = Math.floor(msValue / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);

    return parts.join(", ");
}

/**
 * Converts seconds to milliseconds
 * @param {Number} secs 
 * @returns {Number} - Milliseconds
 */
function secsToMs(secs) {
    return secs * 1000;
}

/**
 * Returns an array of file or folder names in a directory
 * @param {String} directory 
 * @param {Boolean} foldersOnly 
 * @returns {Array<String>} - Array of file/folder names
 */
function getAllFiles(directory, foldersOnly = false) {
    let fileNames = [];

    const files = fs.readdirSync(directory, { withFileTypes: true });

    for (const file of files) {
        const filePath = path.join(directory, file.name);

        if (foldersOnly) {
            if (file.isDirectory()) fileNames.push(filePath);
        } else {
            if (file.isFile()) fileNames.push(filePath);
        }
    }

    return fileNames;
};

/**
 * Fetches application commands for a specific guild or globally
 * @param {Client} client
 * @param {String} guildId
 * @returns {Promise<ApplicationCommand>} - The fetched application commands
 */
async function getApplicationCommands(client, guildId) {
    let applicationCommands;

    if (guildId) {
        const guild = await client.guilds.fetch(guildId);
        applicationCommands = guild.commands;
    } else applicationCommands = client.application.commands;

    await applicationCommands.fetch();
    return applicationCommands;
};

/**
 * Fetches button objects from the buttons directory
 * @param {Array<String>} exceptions - Array of button names to exclude
 * @returns {Array<Object>} - Array of button objects
 */
function getButtons(exceptions = []) {


    // TESTAREEEEEEEEEEEEEEEEEEEEEEEEE


    let buttons = [];
    const buttonFiles = getAllFiles(path.join(__dirname, "..", "buttons"));

    for (const buttonFile of buttonFiles) {
        const buttonObject = require(buttonFile);

        if (exceptions.includes(buttonObject.name)) continue;
        buttons.push(buttonObject);
    };

    return buttons;
};

const colorNameList = require("color-name-list");
/**
 * Fetches the color name for a given hex code
 * @param {String} hex - The hex code of the color
 * @returns {Promise<String>} - The name of the color or the hex code if not found
 */
function getColorName(hex) {
    const color = colorNameList.find(c => c.hex === hex.toUpperCase());
    return color ? color.name : hex;
}

/**
 * Function to get differences between 2 objects
 * @param {Object} oldObj
 * @param {Object} newObj
 * @param {String} [prefix=''] - The prefix to add to the key
 * @param {Set} [visited=new Set()] - The set of visited objects to avoid circular references
 * @returns {Object} - The differences between the two objects
 */
function getDifferences(oldObj, newObj, prefix = '', visited = new Set()) {
    const differences = {};

    if (!oldObj || !newObj) return differences;

    // Add visited objects to avoid circular references
    visited.add(oldObj);
    visited.add(newObj);

    for (const key in newObj) {
        if (newObj.hasOwnProperty(key)) {
            const oldVal = oldObj[key];
            const newVal = newObj[key];
            const fullKey = prefix ? `${prefix}.${key}` : key;

            if (typeof newVal === 'object' && newVal !== null && !Array.isArray(newVal)) {
                // Avoid circular references
                if (!visited.has(newVal)) {
                    const nestedDifferences = getDifferences(oldVal, newVal, fullKey, visited);
                    Object.assign(differences, nestedDifferences);
                }
            } else if (newVal !== oldVal) {
                differences[fullKey] = {
                    oldValue: oldVal !== undefined ? oldVal : "N/A",
                    newValue: newVal !== undefined ? newVal : "N/A"
                };
            }
        }
    }

    return differences;
}

/**
 * Fetches local command objects from the commands directory
 * @param {Array<String>} exceptions - Array of command names to exclude
 * @returns {Array<Object>} - Array of local command objects
 */
function getLocalCommands(exceptions = []) {
    let localCommands = [];
    const commandCategories = getAllFiles(path.join(__dirname, "..", "commands"), true);

    for (const commandCategory of commandCategories) {
        const commandFiles = getAllFiles(commandCategory);

        for (const commandFile of commandFiles) {
            const commandObject = require(commandFile);

            if (exceptions.includes(commandObject.name)) continue;
            localCommands.push(commandObject);
        };
    };

    return localCommands;
};

/**
 * Fetches all context menu objects from the contextmenus directory
 * @param {Array<String>} exceptions - Array of context menu names to exclude
 * @returns {Array<Object>} - Array of context menu objects
 */
function getLocalContextMenus(exceptions = []) {
    let localContextMenus = [];
    const menuFiles = getAllFiles(path.join(__dirname, "..", "contextmenus"));

    for (const menuFile of menuFiles) {
        const menuObject = require(menuFile);

        if (exceptions.includes(menuObject.name)) continue;
        localContextMenus.push(menuObject);
    }

    return localContextMenus;
};

/**
 * Fetches the maximum upload size for a given guild
 * @param {Object} guild - The guild object
 * @returns {Number} - The maximum upload size in bytes
 */
function getMaxUploadSize(guild) {
    if (!guild) return 8 * 1024 * 1024; // 8MB for DM

    // boost levels
    // 0 = no boost
    // 1 = level 1
    // 2 = level 2
    // 3 = level 3
    // NOTE: premiumTier returns exactly 0..3
    const tier = guild.premiumTier;

    switch (tier) {
        case 3:
            return 100 * 1024 * 1024; // 100 MB
        case 2:
            return 50 * 1024 * 1024;  // 50 MB
        case 1:
            return 25 * 1024 * 1024;  // 25 MB
        default:
            return 8 * 1024 * 1024;   // 8 MB
    }
}

/**
 * Fetches all modal objects from the modals directory
 * @param {Array<String>} exceptions - Array of modal names to exclude
 * @returns {Array<Object>} - Array of modal objects
 */
function getModals(exceptions = []) {
    let modals = [];
    const modalFiles = getAllFiles(path.join(__dirname, "..", "modals"));

    for (const modalFile of modalFiles) {
        const modalObject = require(modalFile);

        if (exceptions.includes(modalObject.name)) continue;
        modals.push(modalObject);
    }

    return modals;
};

/**
 * Function to get differences between 2 permission overwrites
 * @param {PermissionOverwriteManager} oldPermissions 
 * @param {PermissionOverwriteManager} newPermissions 
 * @returns {Object} - The differences between the two permission overwrites
 */
function getPermissionDifferences(oldPermissions, newPermissions) {
    const differences = [];

    const oldPermsMap = new Map(oldPermissions.map(overwrite => [overwrite.id, overwrite]));
    const newPermsMap = new Map(newPermissions.map(overwrite => [overwrite.id, overwrite]));

    for (const [id, newPerm] of newPermsMap) {
        const oldPerm = oldPermsMap.get(id);
        if (!oldPerm) differences.push({ id, type: newPerm.type, allow: newPerm.allow, deny: newPerm.deny, change: 'added' });
        else {
            const permDifferences = getDifferences(oldPerm, newPerm);
            if (Object.keys(permDifferences).length > 0) {
                // Format bitfields to human-readable permissions
                if (permDifferences['allow.bitfield']) {
                    permDifferences['allow.bitfield'].oldValue = formatPermissions(permDifferences['allow.bitfield'].oldValue);
                    permDifferences['allow.bitfield'].newValue = formatPermissions(permDifferences['allow.bitfield'].newValue);
                }

                if (permDifferences['deny.bitfield']) {
                    permDifferences['deny.bitfield'].oldValue = formatPermissions(permDifferences['deny.bitfield'].oldValue);
                    permDifferences['deny.bitfield'].newValue = formatPermissions(permDifferences['deny.bitfield'].newValue);
                }

                differences.push({ id, type: newPerm.type, differences: permDifferences, change: 'updated' });
            }
        }
    }

    for (const [id, oldPerm] of oldPermsMap)
        if (!newPermsMap.has(id)) differences.push({ id, type: oldPerm.type, allow: oldPerm.allow, deny: oldPerm.deny, change: 'removed' });

    return differences;
}

/**
 * Return an array of Discord text channels formatted for a dropdown menu.
 * @param {Guild} guild - The Discord.js guild object
 * @param {Object} [opts] - Additional options
 * @param {string} [opts.placeholderLabel] - Optional label to put at the top of the list
 * @param {string} [opts.placeholderValue] - Optional value for the placeholder option
 * @param {string} [opts.emoji] - Optional emoji for each channel
 * @returns {Array<{label: string, value: string, emoji?: string}>}
 */
function getTextChannelOptions(guild, opts = {}) {
    const { placeholderLabel, placeholderValue, emoji } = opts;

    const channels = guild.channels.cache
        .filter(c => c.type === ChannelType.GuildText)
        .map(c => ({
            label: c.name,
            value: c.id,
            emoji: emoji || "📢"
        }));

    if (placeholderLabel && placeholderValue) {
        channels.unshift({
            label: placeholderLabel,
            value: placeholderValue,
            emoji: emoji || "📢"
        });
    }

    return channels;
}

/**
 * Generates a cryptographically secure random string of a specified length.
 * @param {Number} length - The length of the random string to generate.
 * @param {String} [characters] - Optional set of characters to use. Default: A-Z, a-z.
 * @returns {String} - The generated random string.
 */
function generateRandomString(length, characters) {
    if (!characters) {
        characters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
            .concat(Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)))
            .join('');
    }

    const bytes = crypto.randomBytes(length);
    let result = "";
    for (let i = 0; i < length; i++)
        result += characters[bytes[i] % characters.length];

    return result;
}

/**
 * Converts milliseconds to seconds (not formatted version).
 * @param {Number} ms 
 * @returns {Number}
 */
function msToSecs(ms) {
    return Math.floor(ms / 1000);
}

/**
 * Sanitize a string to be a valid filename.
 * @param {String} str - The input string to sanitize.
 * @param {Number} maxLen - The maximum length of the sanitized string.
 * @param {Number} minLen - The minimum length of the sanitized string.
 * @returns {String} - The sanitized filename.
 */
function sanitizeFilename(str, maxLen = 64, minLen = 5) {
    let sanitized = str.replace(/[^a-z0-9_\-]/gi, '');
    sanitized = sanitized.slice(0, maxLen);

    if (sanitized.length < minLen) sanitized = sanitized.padEnd(minLen, '_');

    return sanitized;
}

/**
 * Suppresses console log and warning messages from youtubei.js and youtube-js libraries.
 * This is useful to avoid cluttering the console with non-critical messages.
 */
function suppressYoutubeJSLibErrors() {
    const originalLog = console.log;
    const originalWarn = console.warn;

    console.log = function (...args) {
        if (
            typeof args[0] === "string" &&
            (args[0].startsWith("[YOUTUBEJS]") || args[0].startsWith("[youtubei.js]"))
        ) return;
        originalLog.apply(console, args);
    };

    console.warn = function (...args) {
        if (
            typeof args[0] === "string" &&
            (args[0].startsWith("[YOUTUBEJS]") || args[0].startsWith("[youtubei.js]"))
        ) return;
        originalWarn.apply(console, args);
    };
}

/**
 * Converts a string to title case, replacing hyphens and underscores with spaces.
 * @param {String} str - The string to convert.
 * @returns {String} - The string in title case.
 */
function titleCase(str) {
    if (!str) return "";

    return str
        .trim()
        .toLowerCase()
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (match) => match.toUpperCase());
}

/**
 * Function to validate embed fields. If name or value fields are not strings, they will be converted to strings.
 * @param {Embed} embed 
 * @returns {Embed}
 */
function validateEmbedFields(embed) {
    if (embed.data.fields)
        embed.data.fields.forEach(field => {
            if (typeof field.name !== 'string') field.name = String(field.name);
            if (typeof field.value !== 'string') field.value = String(field.value);
        });

    return embed;
}

module.exports = {
    buildTicketEmbed,
    buttonPagination,
    commandComparing,
    formatPermissions,
    formattedDate,
    formattedMsToSecs,
    getAllFiles,
    getApplicationCommands,
    getButtons,
    getColorName,
    getDifferences,
    getLocalCommands,
    getLocalContextMenus,
    getMaxUploadSize,
    getModals,
    getPermissionDifferences,
    getTextChannelOptions,
    msToSecs,
    generateRandomString,
    sanitizeFilename,
    secsToMs,
    suppressYoutubeJSLibErrors,
    titleCase,
    validateEmbedFields
};