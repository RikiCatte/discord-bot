const { model, Schema } = require('mongoose')

let ticketSetup = new Schema({
    GuildID: String,
    Channel: String,
    Category: String,
    Transcripts: String,
    Handlers: String,
    Everyone: String,
    Description: String,
    EmbedColor: String,
    CustomId: [String],
    TicketCategories: [String],
    MessageId: String,
    Emojis: [String],
    CategoriesEmojiArray: [{
        category: String,
        emoji: String
    }]
});

module.exports = model("TicketSetup", ticketSetup);