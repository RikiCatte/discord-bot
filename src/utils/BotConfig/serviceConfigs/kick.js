module.exports = {
    name: "kick",
    updateFields: () => ({ enabled: true }),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`kick\` service succesfully **ENABLED**",
        editSuccess: () => `\`⚠️\` The \`kick\` service is not editable through this command. If you want to disable it run \`/bot-set-service\` \`kick\` \`disable\`.,`,
    },
    silentReEnable: true,
    editNotSupported: true
};