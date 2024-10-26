const { model, Schema } = require("mongoose");

let captchaSetupSchema = new Schema({
    Guild: String,
    Role: String,
    ReJoinLimit: Number,
    RandomText: Boolean,
    ExpireInMS: Number,
    Captcha: String,
});

module.exports = model("captcha-setup", captchaSetupSchema)