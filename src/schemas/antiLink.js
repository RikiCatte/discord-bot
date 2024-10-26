const { model, Schema } = require("mongoose");

let linkSchema = new Schema({
    Guild: String,
    Permissions: String
});

module.exports = model("antilink", linkSchema);