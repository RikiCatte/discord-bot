const { model, Schema } = require('mongoose');

let kickSchema = new Schema({
    UserID: String,
    Reason: String,
    KickedBy: String,
    KickedAt: Date,
})

module.exports = model('kick', kickSchema);