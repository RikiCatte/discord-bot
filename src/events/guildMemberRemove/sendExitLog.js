const msgConfig = require("../../messageConfig.json");

module.exports = async (client, member) => {
    const channelId = `${msgConfig.exitMembersLogsChannel}`;
    const channel = member.guild.channels.cache.get(channelId);

    if (channel) {
        try {
            const auditLogs = await member.guild.fetchAuditLogs({
                type: 22, // MemberBan
            });

            const banLog = auditLogs.entries.find(
                (log) => log.target.id === member.id
            );

            if (banLog) {
                return channel.send(`Member **${member.user.tag}** Exited the server due to **ban**.`);
            } else {
                return channel.send(`Member **${member.user.tag}** Left himself the server.`);
            }
        } catch (error) {
            console.error(error);
        }
    }
}