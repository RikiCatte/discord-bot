module.exports = {
    name: "giveaway",
    updateFields: () => ({enabled: true}),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`giveaway\` service succesfully **ENABLED**",
        editSuccess: () => "\`✅\` \`giveaway\` service succesfully **UPDATED**"
    },
    silentReEnable: true
}