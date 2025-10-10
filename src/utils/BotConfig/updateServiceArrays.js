const BotConfig = require("../../schemas/BotConfig");

const arrPath = (service, arrayField) => `services.${service}.${arrayField}`;

/**
 * Asserts that a guild ID is provided.
 * @param {String} guildId
 */
function assertGuild(guildId) {
    if (!guildId) throw new Error("[updateServiceArrays] guildId is required");
}

/**
 * Asserts that a key is provided.
 * @param {String} name
 * @param {*} value
 */
function assertKey(name, value) {
    if (!value) throw new Error(`[updateServiceArrays] ${name} is required`);
}

/**
 * Push an item to a service array in the BotConfig document (allow duplicates).
 * $push: accepts one or more items (with $each) and allows duplicates.
 * @param {String} guildId
 * @param {String} service
 * @param {String} arrayField
 * @param {any|any[]} itemOrItems
 * @return {Promise<void>}
 */
async function pushToServiceArray(guildId, service, arrayField, itemOrItems) {
    assertGuild(guildId); assertKey("service", service); assertKey("arrayField", arrayField);
    const update = Array.isArray(itemOrItems)
        ? { $push: { [arrPath(service, arrayField)]: { $each: itemOrItems } } }
        : { $push: { [arrPath(service, arrayField)]: itemOrItems } };
    try {
        await BotConfig.findOneAndUpdate({ GuildID: guildId }, update, { upsert: true });
    } catch (err) {
        err.message = `[pushToServiceArray] ${err.message}`;
        throw err;
    }
}

/**
 * Add one or more items to a service array in the BotConfig document only if it doesn't already exist (prevent duplicates).
 * $addToSet: accepts one or more values (with $each) and avoids duplicates.
 * @param {String} guildId
 * @param {String} service
 * @param {String} arrayField
 * @param {any|any[]} valueOrValues
 * @return {Promise<void>}
 */
async function addToSetServiceArray(guildId, service, arrayField, valueOrValues) {
    assertGuild(guildId); assertKey("service", service); assertKey("arrayField", arrayField);
    const update = Array.isArray(valueOrValues)
        ? { $addToSet: { [arrPath(service, arrayField)]: { $each: valueOrValues } } }
        : { $addToSet: { [arrPath(service, arrayField)]: valueOrValues } };
    try {
        await BotConfig.findOneAndUpdate({ GuildID: guildId }, update, { upsert: true });
    } catch (err) {
        err.message = `[addToSetServiceArray] ${err.message}`;
        throw err;
    }
}

/**
 * Pulls array items that match the criteria from a service array in the BotConfig document.
 * $pull: removes items based on a criteria (object match or primitive).
 * @param {String} guildId
 * @param {String} service
 * @param {String} arrayField
 * @param {Object|any} criteria - object match (e.g. { id: "123" }) or primitive (e.g. "123")
 * @return {Promise<void>}
 */
async function pullFromServiceArray(guildId, service, arrayField, criteria) {
    assertGuild(guildId); assertKey("service", service); assertKey("arrayField", arrayField);
    try {
        await BotConfig.findOneAndUpdate(
            { GuildID: guildId },
            { $pull: { [arrPath(service, arrayField)]: criteria } },
            { upsert: true }
        );
    } catch (err) {
        err.message = `[pullFromServiceArray] ${err.message}`;
        throw err;
    }
}

/**
 * Sets multiple fields for a service in the BotConfig document (replacement of updateServiceConfig()).
 * $set on multiple scalar/non-array fields of the service.
 * @param {String|Object} configOrGuildId - GuildID or BotConfig document
 * @param {String} service
 * @param {Object} fields - object with key-value pairs to set
 * @return {Promise<void>}
 */
async function setServiceFields(configOrGuildId, service, fields) {
    const guildId = typeof configOrGuildId === "string" ? configOrGuildId : configOrGuildId?.GuildID;
    assertGuild(guildId); assertKey("service", service); assertKey("fields", fields);
    const $set = Object.fromEntries(
        Object.entries(fields).map(([k, v]) => [`services.${service}.${k}`, v])
    );
    try {
        await BotConfig.findOneAndUpdate({ GuildID: guildId }, { $set }, { upsert: true, new: true });
    } catch (err) {
        err.message = `[setServiceFields] ${err.message}`;
        throw err;
    }
}

/**
 * Updates an element in a service array in the BotConfig document.
 * Positional update of a single array element (match + patch).
 * @param {String} guildId
 * @param {String} service
 * @param {String} arrayField
 * @param {String} matchField - field name to match within the array items
 * @param {any} matchValue - value to match within the array items
 * @param {Object} setObject - object with key-value pairs to set on the matched item
 * @return {Promise<void>}
 */
async function updateServiceArrayElement(guildId, service, arrayField, matchField, matchValue, setObject) {
    assertGuild(guildId); assertKey("service", service); assertKey("arrayField", arrayField);
    assertKey("matchField", matchField); assertKey("setObject", setObject);
    const filter = { GuildID: guildId, [`${arrPath(service, arrayField)}.${matchField}`]: matchValue };
    const $set = Object.fromEntries(
        Object.entries(setObject).map(([k, v]) => [`${arrPath(service, arrayField)}.$.${k}`, v])
    );
    try {
        await BotConfig.findOneAndUpdate(filter, { $set }, { upsert: false });
    } catch (err) {
        err.message = `[updateServiceArrayElement] ${err.message}`;
        throw err;
    }
}

module.exports = {
    pushToServiceArray,
    addToSetServiceArray,
    pullFromServiceArray,
    setServiceFields,
    updateServiceArrayElement,
};