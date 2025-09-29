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

module.exports = { getMaxUploadSize };