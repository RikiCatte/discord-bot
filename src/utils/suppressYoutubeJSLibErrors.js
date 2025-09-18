/**
 * Suppresses console log and warning messages from youtubei.js and youtube-js libraries.
 * This is useful to avoid cluttering the console with non-critical messages.
 */
module.exports = function suppressYoutubeJSLibErrors() {
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