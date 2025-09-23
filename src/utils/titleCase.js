/**
 * Converts a string to title case, replacing hyphens and underscores with spaces.
 * @param {string} str - The string to convert.
 * @returns {string} - The string in title case.
 */
function titleCase(str) {
    if (!str) return "";

    return str
        .trim()
        .toLowerCase()
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (match) => match.toUpperCase());
}

module.exports = titleCase;