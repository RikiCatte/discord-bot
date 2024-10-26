const { Schema, model } = require("mongoose");

let msgSchema = new Schema({
    Guild: String,
    User: String,
    Messages: Number
});

module.exports = model("msgSchema", msgSchema);