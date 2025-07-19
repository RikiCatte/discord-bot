module.exports = {
    name: "ban",
    updateFields: () => ({enabled: true}),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`ban\` service succesfully **ENABLED**",
        editSuccess: () => "\`✅\` \`ban\` service succesfully **UPDATED**"
    },
    silentReEnable: true
}