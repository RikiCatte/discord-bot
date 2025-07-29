module.exports = {
    name: "unban",
    updateFields: () => ({ enabled: true }),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`unban\` service succesfully **ENABLED**",
        editSuccess: () => `\`⚠️\` The \`unban\` service is not editable through this command. If you want to disable it run \`/bot-set-service\` \`unban\` \`disable\`. 
                        If you want to manage bans please use \`/ban\` or \`/unban\` bot commands or use your Discord client.`,
    },
    silentReEnable: true,
    editNotSupported: true
}