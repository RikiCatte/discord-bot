module.exports = {
    name: "giveaway",
    updateFields: () => ({enabled: true}),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`giveaway\` service succesfully **ENABLED**",
    },
    silentReEnable: true,
    editNotSupported: true
}