const { Schema, model } = require("mongoose");

const giveawaySchema = new Schema({
    Ended: Boolean,
    Paused: Boolean,
    GuildID: String,
    ChannelID: String,
    MessageID: String,
    EndTimestamp: Number,
    RemainingTime: Number,
    Prize: String,
    Participants: [{ type: String }],
    WinnerCount: { type: Number, default: 1 },
}, { timestamps: true }
);

module.exports = model("Giveaways", giveawaySchema);