const msgConfig = require("../../messageConfig.json");

module.exports = (client, member) => {
    client.channels.cache.get(`${msgConfig.serverStats_TotalUsersChannel}`).setName(`👥 Total users: ${member.guild.memberCount}`)
    client.channels.cache.get(`${msgConfig.serverStats_MembersChannel}`).setName(`👤 Members - ${member.guild.members.cache.filter(member => !member.user.bot).size}`)
    client.channels.cache.get(`${msgConfig.serverStats_BotsChannel}`).setName(`🤖 Bots - ${member.guild.members.cache.filter(member => member.user.bot).size}`)
    client.channels.cache.get(`${msgConfig.serverStats_SubscribersChannel}`).setName(`⭐ Subscribers - ${member.guild.members.cache.filter(member => member.roles && member.roles.cache.has("1185328814662889482")).size}`)
    client.channels.cache.get(`${msgConfig.serverStats_VerifiedUsersChannel}`).setName(`✅ Verified Users - ${member.guild.members.cache.filter(member => member.roles && member.roles.cache.has("1185322893211602985")).size}`)
    client.channels.cache.get(`${msgConfig.serverStats_ServerBoostersChannel}`).setName(`🚀 Server Boosters - ${member.guild.members.cache.filter(member => member.roles && member.roles.cache.has("1185333666889605201")).size}`)
    client.channels.cache.get(`${msgConfig.serverStats_AmiciMelonianiChannel}`).setName(`🍈 Amici Meloniani - ${member.guild.members.cache.filter(member => member.roles && member.roles.cache.has("1185330186569404547")).size}`)
}