const { model, Schema } = require('mongoose');

let banSchema = new Schema({
    Guild: String,
    UserID: String,
    Reason: String,
    BannedAt: Date,
})

module.exports = model('ban', banSchema);