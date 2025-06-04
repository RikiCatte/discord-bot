const { model, Schema } = require("mongoose");

let captchaUsersDataSchema = new Schema({
    Guild: String,
    UserID: String,
    Username: String,
    JoinedAt: String,
    ReJoinedTimes: Number,
    Captcha: String,
    CaptchaStatus: String,
    CaptchaExpired: Boolean,
    MissedTimes: Number,
    Resent: Boolean,
    ResentBy: String,
    Bypassed: Boolean,
    BypassedBy: String,
});

module.exports = model("captchas-data", captchaUsersDataSchema)