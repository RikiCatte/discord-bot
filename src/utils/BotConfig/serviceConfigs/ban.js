module.exports = {
    name: "ban",
    updateFields: () => ({enabled: true}),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`ban\` service succesfully **ENABLED**",
        editSuccess: () => `\`⚠️\` The \`ban\` service is not editable through this command. If you want to disable it run \`/bot-set-service\` \`ban\` \`disable\`. 
                        If you want to manage bans please use \`/ban\` or \`/unban\` bot commands or use your Discord client.`,
    },
    silentReEnable: true,
    editNotSupported: true
}