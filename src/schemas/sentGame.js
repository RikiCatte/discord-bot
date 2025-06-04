const { model, Schema } = require('mongoose');

let sentGameSchema = new Schema({
    title: String,
    description: String,
    url: String,
    source: String,
    startDate: Date,
    endDate: Date,
    notifiedAt: Date,
    image: Buffer
});

module.exports = model("SentGame", sentGameSchema);