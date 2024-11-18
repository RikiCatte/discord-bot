/**
 * Function to get differences between 2 objects
 * @param {Object} oldObj
 * @param {Object} newObj
 * @param {String} [prefix=''] - The prefix to add to the key
 * @param {Set} [visited=new Set()] - The set of visited objects to avoid circular references
 * @returns {Object} - The differences between the two objects
 */
module.exports = async function getDifferences(oldObj, newObj, prefix = '', visited = new Set()) {
    const differences = {};

    if (!oldObj || !newObj) {
        return differences;
    }

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