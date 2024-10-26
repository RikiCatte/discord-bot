const { Schema, model } = require("mongoose");

const invitesSetup = new Schema({
    GuildID: { type: String, required: true },
    ChannelID: { type: String, required: true }
});

module.exports = model("invitesSetup", invitesSetup);