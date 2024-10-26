const { EmbedBuilder, MembershipScreeningFieldType } = require("discord.js");
const invitesystemSchema = require("../../schemas/invitesSetup");
const inviteSchema = require("../../schemas/invite");

module.exports = async (client, member) => {
    const setupData = await invitesystemSchema.findOne({ GuildID: member.guild.id });

    if (!setupData || !setupData.ChannelID || member.user.bot) return;

    const accountAgeLimitDays = 7;
    const accountAge = (new Date() - member.user.createdAt) / (1000 * 60 * 60 * 24);
    const isFake = accountAge < accountAgeLimitDays;

    const newInvites = await member.guild.invites.fetch();
    const invites = await inviteSchema.find({ Guild: member.guild.id });

    let usedInvite = null;
    for (const invite of newInvites.values()) {
        const found = invites.find((i) => i.InviteCodes.some((code) => code.Code === invite.code));

        if (found) {
            const dbCode = found.InviteCodes.find((code) => code.Code === invite.code);

            if (invite.uses > dbCode.Uses) {
                usedInvite = invite;
                break;
            }
        }
    }

    if (usedInvite) {
        await inviteSchema.findOneAndUpdate({ GuildID: member.guild.id, "InviteCodes.Code": usedInvite.code }, {
            $inc: { TotalInvites: 1, "InviteCodes.$.Uses": 1 },
            $push: { InvitedUsers: { User: { UserID: member.id, Fake: isFake, Left: false } } }
        });

        const channel = member.guild.channels.cache.get(setupData.ChannelID);
        if (!channel) return;

        const rEmbed = new EmbedBuilder()
            .setColor(isFake ? "Red" : "Green")
            .setTitle("Invite Used")
            .setDescription(`${member.user.username} joined using ${usedInvite.code}. Account Age: ${accountAge.toFixed(2)} days. 
                ${isFake ? `Marked as fake due to account age being less than ${accountAgeLimitDays} days.` : ""}`
            )
            .setTimestamp();

        await channel.send({ embeds: [rEmbed] });
    }
}