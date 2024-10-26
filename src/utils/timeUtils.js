const ms = require("ms");

async function formattedMsToSecs(ms) {
    // 1 sec = 1000 ms
    const seconds = Math.floor((ms / 1000) % 60);
    // 1 min = 60 sec
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    // 1 h = 60 mins
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    // 1 d = 24 h
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    // return formatted "date"
    return `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}

async function secsToMs(secs) {
    return secs * 1000;
}

module.exports = {
    msToSecs: formattedMsToSecs,
    secsToMs
};