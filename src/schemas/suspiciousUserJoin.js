const { Schema, model } = require("mongoose");

let suspiciousUserJoin = new Schema({
    GuildID: String,
    SusUserID: String,
    MessageID: String,
    JoinDate: String,
    TakenAction: Boolean,
    Action: String,
    ModeratedBy: String,
});

module.exports = model("suspicioususerjoin", suspiciousUserJoin);