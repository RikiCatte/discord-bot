const getDifferences = require("./getDifferences.js");
const formatPermissions = require("./formatPermissions.js");

/**
 * Function to get differences between 2 permission overwrites
 * @param {PermissionOverwriteManager} oldPermissions 
 * @param {PermissionOverwriteManager} newPermissions 
 * @returns {Object} - The differences between the two permission overwrites
 */
module.exports = async function getPermissionDifferences(oldPermissions, newPermissions) {
    const differences = [];

    const oldPermsMap = new Map(oldPermissions.map(overwrite => [overwrite.id, overwrite]));
    const newPermsMap = new Map(newPermissions.map(overwrite => [overwrite.id, overwrite]));

    for (const [id, newPerm] of newPermsMap) {
        const oldPerm = oldPermsMap.get(id);
        if (!oldPerm) {
            differences.push({ id, type: newPerm.type, allow: newPerm.allow, deny: newPerm.deny, change: 'added' });
        } else {
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

    for (const [id, oldPerm] of oldPermsMap) {
        if (!newPermsMap.has(id)) {
            differences.push({ id, type: oldPerm.type, allow: oldPerm.allow, deny: oldPerm.deny, change: 'removed' });
        }
    }

    return differences;
}