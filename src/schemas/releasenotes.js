const { Schema, model } = require("mongoose");

let releasenotes = new Schema({
    Updates: String,
    Date: String,
    Developer: String,
    Version: Number
});

module.exports=model("releasenotes", releasenotes)