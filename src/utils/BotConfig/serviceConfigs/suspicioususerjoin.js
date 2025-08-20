module.exports = {
    name: "suspicioususerjoin",
    updateFields: () => ({ enabled: true }),
    replyStrings: {
        setupSuccess: () => "\`✅\` \`suspicioususerjoin\` service succesfully **ENABLED**",
        editSuccess: () => `\`⚠️\` The \`suspicioususerjoin\` service is not editable through this command. If you want to disable it run \`/bot-set-service\` \`suspicioususerjoin\` \`disable\`.`,
    },
    silentReEnable: true,
    editNotSupported: true
}