module.exports = {
    name: "serverstats",
    updateFields: () => ({ enabled: true }),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`serverstats\` service succesfully **ENABLED**. Please go to MongoDB and manually set up the system as shown in the GitHub wiki.",
    },
    silentReEnable: true,
    editNotSupported: true
}