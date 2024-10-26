const { Schema, model } = require("mongoose");

const greetingSchema = new Schema({
    GuildID: String,
    Welcome: {
        Enabled: Boolean,
        ChannelID: String,
        Message: String,
        BorderColor: String,
    },
    Goodbye: {
        Enabled: Boolean,
        ChannelID: String,
        Message: String,
        BorderColor: String,
    }
});

module.exports = model("greeting", greetingSchema);