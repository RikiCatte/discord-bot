function sanitizeFilename(str, maxLen = 64, minLen = 5) {
    let sanitized = str.replace(/[^a-z0-9_\-]/gi, '');
    sanitized = sanitized.slice(0, maxLen);
    if (sanitized.length < minLen) sanitized = sanitized.padEnd(minLen, '_');
    return sanitized;
}

module.exports = { sanitizeFilename };