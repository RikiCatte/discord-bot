module.exports = {
    name: "ban",
    updateFields: () => ({enabled: true}),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`ban\` service succesfully **ENABLED**",
    },
    silentReEnable: true,
    editNotSupported: true
}