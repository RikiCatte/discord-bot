const { TextInputStyle, ChannelType } = require("discord.js");

const suggestFields = [
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
        customId: action === "enable" ? "suggest-channel-setup" : "suggest-channel-edit",
        title: action === "enable" ? "Enable Suggest Service" : "Edit Suggest Service",
        fields: suggestFields
    };
}

module.exports = {
    name: "suggest",
    getModal,
    fields: suggestFields,
    updateFields: (values) => ({ enabled: true, ChannelID: values.ChannelID }),
    validateInput: async (interaction, updated) => {
        const channel = interaction.guild.channels.cache.get(updated.ChannelID);
        if (!channel || channel.type !== ChannelType.GuildText) throw new Error("`❌` The channel ID you entered does not exist in this server or the channel you entered is not a text channel.");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`suggest\` service successfully **ENABLED**, suggestions will be sent to <#${values.ChannelID}>`,
        editSuccess: (values) => `\`✅\` \`suggest\` service successfully **UPDATED**, suggestions will now be sent to <#${values.ChannelID}>`
    }
};