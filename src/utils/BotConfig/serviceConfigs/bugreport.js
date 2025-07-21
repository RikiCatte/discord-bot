const { TextInputStyle } = require("discord.js");

const bugReportFields = [
    { customId: "channelID", label: "The channel ID", style: TextInputStyle.Short, placeholder: "Input the channel ID" }
];

function getModal(action) {
    return {
        customId: "bugreport-channel-setup",
        title: "Setup Bug Report Channel",
        fields: bugReportFields
    };
}

module.exports = {
    name: "bugreport",
    getModal,
    fields: bugReportFields,
    updateFields: (values) => ({
        enabled: true,
        ReportChannelID: values.channelID
    }),
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`bugreport\` service successfully **ENABLED**, bug reports will be sent to <#${values.ReportChannelID}>`,
        editSuccess: (values) => `\`✅\` \`bugreport\` service successfully **UPDATED**, bug reports will now be sent to <#${values.ReportChannelID}>`
    }
}