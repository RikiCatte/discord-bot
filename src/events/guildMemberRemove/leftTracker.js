const inviteSchema = require("../../schemas/invite");

module.exports = async (client, member) => {
    await inviteSchema.updateOne(
        { GuildID: member.guild.id, "InvitedUsers.User.UserID": member.id },
        { $set: { "InvitedUsers.$.User.Left": true } }
    )
}