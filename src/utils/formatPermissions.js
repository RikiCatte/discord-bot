const { PermissionsBitField } = require("discord.js");
/**
 * Function to format permissions bitfield to human-readable permissions
 * @param {PermissionsBitField | bigint} bitfield 
 * @returns {string} - A string containing the human-readable permissions splitted by commas
 */
module.exports = async function formatPermissions(bitfield) {
    const permissions = new PermissionsBitField(bitfield);
    return permissions.toArray().join(', ');
}