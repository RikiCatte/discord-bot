const { TextInputStyle, ChannelType } = require("discord.js");

const pollFields = [
    {
        customId: "ChannelID",
        label: "Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Enter the channel ID for the poll channel",
        minLength: 18,
        maxLength: 19,
        required: true
    }
];

function getModal(action) {
    return {
        customId: action === "enable" ? "poll-channel-setup" : "poll-channel-edit",
        title: action === "enable" ? "Enable Poll System" : "Edit Poll System",
        fields: pollFields
    };
}

module.exports = {
    name: "poll",
    getModal,
    fields: pollFields,
    updateFields: (values) => ({ enabled: true, ChannelID: values.ChannelID }),
    validateInput: async (interaction, updated) => {
        const channel = interaction.guild.channels.cache.get(updated.ChannelID);
        if (!channel || channel.type !== ChannelType.GuildText) throw new Error("`❌` The channel ID you entered does not exist in this server.");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`Poll\` service succesfully **ENABLED**, polls will be sent to <#${values.ChannelID}>`,
        editSuccess: (values) => `\`✅\` \`Poll\` service succesfully **EDITED**, polls will now be sent to <#${values.ChannelID}>`
    }
}