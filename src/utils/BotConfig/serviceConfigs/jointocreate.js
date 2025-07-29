const { TextInputStyle } = require("discord.js");

const joinToCreateFields = [
    {
        customId: "ChannelID",
        label: "Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Enter the channel ID where the join to create system will listen to.",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "UserLimit",
        label: "User Limit",
        style: TextInputStyle.Short,
        placeholder: "Enter the user limit for the join to create channel (1-99).",
        minLength: 1,
        maxLength: 2,
        required: true
    }
]

function getModal(action) {
    return {
        customId: action === "enable" ? "jointocreate-setup" : "jointocreate-edit",
        title: action === "enable" ? "Enable Join to Create" : "Edit Join to Create",
        fields: joinToCreateFields
    };
}

module.exports = {
    name: "jointocreate",
    getModal,
    fields: joinToCreateFields,
    updateFields: (values) => ({
        enabled: true,
        ChannelID: values.ChannelID,
        UserLimit: parseInt(values.UserLimit)
    }),
    validateInput: async (interaction, updated) => {
        const channel = interaction.guild.channels.cache.get(updated.ChannelID);
        if (!channel) throw new Error("`❌` The channel ID you entered does not exist in this server.");

        if (isNaN(updated.UserLimit) || updated.UserLimit < 1 || updated.UserLimit > 99) throw new Error("`❌` User limit must be a number between 1 and 99.");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` Successfully set up the Join to Create system in <#${values.ChannelID}> with a user limit of \`${values.UserLimit}\`.`,
        editSuccess: (values) => `\`✅\` Successfully updated the Join to Create system in <#${values.ChannelID}> with a user limit of \`${values.UserLimit}\`.`
    }
}