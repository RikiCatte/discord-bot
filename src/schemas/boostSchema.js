const { model, Schema } = require("mongoose");

let boostSchema = new Schema({
    guildID: String,
    boostingChannelID: String,
    boostEmbedColor: String,
    boostEmbedTitle: String,
    boostEmbedMsg: String,
    boostMsg: String,
}, { strict: false });

module.exports = model("boost", boostSchema);