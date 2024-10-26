const { model, Schema } = require("mongoose");

let bugReportSchema = new Schema({
    GuildID: String,
    ReportID: String,
    ReportingMemberID: String,
    RepCommand: String,
    RepDescription: String,
    Solved: Boolean,
    FixedBy: String,
});

module.exports = model("bugreport", bugReportSchema)