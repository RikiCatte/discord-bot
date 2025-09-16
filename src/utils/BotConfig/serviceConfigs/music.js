module.exports = {
    name: "music",
    updateFields: () => ({enabled: true}),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`music\` service succesfully **ENABLED**, you can now use that commands across the guild",
        editSuccess: () => "\`✅\` \`music\` service succesfully **UPDATED**, you can now use that commands across the guild"
    },
    silentReEnable: true,
    editNotSupported: true
}