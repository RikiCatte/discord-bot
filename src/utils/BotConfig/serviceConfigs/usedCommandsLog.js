const { TextInputStyle } = require("discord.js");

const usedCommandsLogFields = [
    {
        customId: "ChannelID",
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
        customId: action === "enable" ? "usedcommandslog-channel-setup" : "usedcommandslog-channel-edit",
        title: action === "enable" ? "Enable Used Commands Log Service" : "Edit Used Commands Log Service",
        fields: usedCommandsLogFields
    };
}

module.exports = {
    name: "usedCommandsLog",
    getModal,
    fields: usedCommandsLogFields,
    updateFields: (values) => ({ enabled: true, ChannelID: values.ChannelID }),
    validateInput: async (interaction, updated) => {
        const channel = interaction.guild.channels.cache.get(updated.ChannelID);
        if (!channel) throw new Error("`❌` The channel ID you entered does not exist in this server.");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`usedCommandsLog\` service successfully **ENABLED**, used commands will be logged to <#${values.ChannelID}>`,
        editSuccess: (values) => `\`✅\` \`usedCommandsLog\` service successfully **UPDATED**, used commands will now be logged to <#${values.ChannelID}>`
    }
}