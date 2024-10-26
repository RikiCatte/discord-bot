const { model, Schema } = require("mongoose");

let linkSchemaWL = new Schema({
    Guild: String,
    UserID: String,
    WhitelistedBy: String,
});

module.exports = model("antilinkwl", linkSchemaWL);