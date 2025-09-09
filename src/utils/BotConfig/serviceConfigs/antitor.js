module.exports = {
    name: "antitor",
    updateFields: () => ({enabled: true}),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`antitor\` service succesfully **ENABLED**, you can now use that commands across the guild",
        editSuccess: () => "\`✅\` \`antitor\` service succesfully **UPDATED**, you can now use that commands across the guild"
    },
    silentReEnable: true,
    editNotSupported: true
}