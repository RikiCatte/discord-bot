const mongoose = require('mongoose');

const botConfigSchema = new mongoose.Schema({
    GuildID: { type: String, required: true, unique: true },
    services: {
        antilink: {
            enabled: { type: Boolean, default: false },
            Permissions: String,
        },
        nitroboost: {
            enabled: { type: Boolean, default: false },
            channelID: String,
            embedColor: String,
            embedTitle: String,
            embedMessage: String,
            boostMessage: String,
        },
        captcha: {
            enabled: { type: Boolean, default: false },
            RoleID: String,
            ReJoinLimit: Number,
            RandomText: Boolean,
            ExpireInMS: Number,
            Captcha: String
        }
    },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BotConfig', botConfigSchema);