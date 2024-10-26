const { model, Schema } = require('mongoose');

let tempMailSchema = new Schema({
    Email: String,
    Token: String,
    MessagesAmount: Number,
    OwnerDiscordID: String,
    ProgressiveNumber: Number,
    ID: String,
    ReceivedAt: Number,
    From: String,
    Subject: String,
    Body: String,
    AttachmentsCount: Number
});

module.exports = model("TempMail", tempMailSchema);