module.exports = {
    name: "serverstats",
    updateFields: () => ({ enabled: true }),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`serverstats\` service succesfully **ENABLED**. Please go to MongoDB and manually set up the system as shown in the GitHub wiki.",
        editSuccess: () => `\`⚠️\` The \`serverstats\` service is not editable through this command. If you want to disable it run \`/bot-set-service\` \`serverstats\` \`disable\`.`,
    },
    silentReEnable: true,
    editNotSupported: true
}