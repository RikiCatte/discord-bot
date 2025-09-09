module.exports = {
    name: "unban",
    updateFields: () => ({ enabled: true }),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`unban\` service succesfully **ENABLED**",
    },
    silentReEnable: true,
    editNotSupported: true
}