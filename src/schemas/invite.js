const { Schema, model } = require("mongoose");

const inviteSchema = new Schema({
    GuildID: { type: String, required: true },
    UserID: { type: String },
    TotalInvites: { type: Number, deafult: 0 },
    InviteCodes: [{
        Code: { type: String },
        Uses: { type: Number, deafult: 0 }
    }],
    InvitedUsers: [{
        User: {
            UserID: { type: String },
            Fake: { type: Boolean, default: false },
            Left: { type: Boolean, default: false }
        }
    }],
});

module.exports = model("invite", inviteSchema);