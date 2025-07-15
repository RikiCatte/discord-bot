/**
 * Return an array of Discord text channels formatted for a dropdown menu.
 * @param {Guild} guild - The Discord.js guild object
 * @param {Object} [opts] - Additional options
 * @param {string} [opts.placeholderLabel] - Optional label to put at the top of the list
 * @param {string} [opts.placeholderValue] - Optional value for the placeholder option
 * @param {string} [opts.emoji] - Optional emoji for each channel
 * @returns {Array<{label: string, value: string, emoji?: string}>}
 */
module.exports = function getTextChannelOptions(guild, opts = {}) {
    const { placeholderLabel, placeholderValue, emoji } = opts;

    // 0 = GuildText in discord.js v14+
    const channels = guild.channels.cache
        .filter(c => c.type === 0)
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