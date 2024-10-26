const invitesystemSchema = require("../../schemas/invitesSetup");
const inviteSchema = require("../../schemas/invite");

module.exports = async (client, invite) => {
    const { code, guild, inviter } = invite;

    const invitesSetupDoc = await invitesystemSchema.findOne({ GuildID: guild.id });
    if (!invitesSetupDoc) return;

    let inviteDoc = await inviteSchema.findOne({ GuildID: guild.id, UserID: inviter.id });

    if (inviteDoc) {
        const inviteCode = { code: code, uses: 0 };

        await inviteSchema.updateOne({ _id: inviteDoc._id }, { $push: { InviteCodes: inviteCode } });
    } else {
        inviteDoc = new inviteSchema({
            GuildID: guild.id,
            UserID: inviter.id,
            TotalInvites: 0,
            InviteCodes: [
                {
                    Code: code,
                    Uses: 0
                }
            ],
            InvitedUsers: []
        });

        await inviteDoc.save();
    }
}