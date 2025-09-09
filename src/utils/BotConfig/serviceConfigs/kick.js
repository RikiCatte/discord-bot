module.exports = {
    name: "kick",
    updateFields: () => ({ enabled: true }),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`kick\` service succesfully **ENABLED**",
    },
    silentReEnable: true,
    editNotSupported: true
};