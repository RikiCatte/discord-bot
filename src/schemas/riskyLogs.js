const { Schema, model } = require("mongoose");

let riskyLogs = new Schema({
    RiskyLogID: String,
    ChannelID: String,
    Guild: String,
    Title: String,
    Date: String,
    Solved: Boolean,
    SolvedBy: String,
});

module.exports = model("riskylogs", riskyLogs);