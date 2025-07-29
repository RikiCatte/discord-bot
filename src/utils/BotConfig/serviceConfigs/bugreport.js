const { TextInputStyle } = require("discord.js");

const bugReportFields = [
    {
        customId: "ReportChannelID",
        label: "The channel ID",
        style: TextInputStyle.Short,
        placeholder: "Input the channel ID",
        minLength: 18,
        maxLength: 19,
        required: true
    }
];

function getModal(action) {
    return {
        customId: action === "enable" ? "bugreport-channel-setup" : "bugreport-channel-edit",
        title: action === "enable" ? "Enable Bug Report Service" : "Edit Bug Report Service",
        fields: bugReportFields
    };
}

module.exports = {
    name: "bugreport",
    getModal,
    fields: bugReportFields,
    updateFields: (values) => ({ enabled: true, ReportChannelID: values.ReportChannelID }),
    validateInput: async (interaction, updated) => {
        const channel = interaction.guild.channels.cache.get(updated.ReportChannelID);
        if (!channel) throw new Error("`❌` The channel ID you entered does not exist in this server.");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`bugreport\` service successfully **ENABLED**, bug reports will be sent to <#${values.ReportChannelID}>`,
        editSuccess: (values) => `\`✅\` \`bugreport\` service successfully **UPDATED**, bug reports will now be sent to <#${values.ReportChannelID}>`
    }
}