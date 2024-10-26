const msgConfig = require("../../messageConfig.json");

module.exports = (client) => {
    const guild = client.guilds.cache.get(`${msgConfig.guild}`);

    client.channels.cache.get(`${msgConfig.serverStats_TotalUsersChannel}`).setName(`👥 Total users: ${guild.memberCount}`);
    client.channels.cache.get(`${msgConfig.serverStats_MembersChannel}`).setName(`👤 Members - ${guild.members.cache.filter(member => !member.user.bot).size}`);
    client.channels.cache.get(`${msgConfig.serverStats_BotsChannel}`).setName(`🤖 Bots - ${guild.members.cache.filter(member => member.user.bot).size}`);
    client.channels.cache.get(`${msgConfig.serverStats_SubscribersChannel}`).setName(`⭐ Subscribers - ${guild.members.cache.filter(member => member.roles && member.roles.cache.has("1185328814662889482")).size}`);
    client.channels.cache.get(`${msgConfig.serverStats_VerifiedUsersChannel}`).setName(`✅ Verified Users - ${guild.members.cache.filter(member => member.roles && member.roles.cache.has("1185322893211602985")).size}`);
    client.channels.cache.get(`${msgConfig.serverStats_ServerBoostersChannel}`).setName(`🚀 Server Boosters - ${guild.members.cache.filter(member => member.roles && member.roles.cache.has("1185333666889605201")).size}`);
    client.channels.cache.get(`${msgConfig.serverStats_AmiciMelonianiChannel}`).setName(`🍈 Amici Meloniani - ${guild.members.cache.filter(member => member.roles && member.roles.cache.has("1185330186569404547")).size}`);

    function statusCount() {
        client.channels.cache.get(`${msgConfig.statusCountChannel}`)
            .setName(`🟢 ${guild.members.cache.filter(m => m.presence?.status == "online").size} ⛔ ${guild.members.cache.filter(m => m.presence?.status == "dnd").size} 🌙 ${guild.members.cache.filter(m => m.presence?.status == "idle").size} ⚫ ${guild.members.cache.filter(m => m.presence?.status == "offline" || !m.presence).size}`);

    }

    statusCount();

    setInterval(() => { // Run function every minute

    }, 600000)
};