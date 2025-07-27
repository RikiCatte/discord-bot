const { TextInputStyle } = require("discord.js");

const joinToCreateFields = [
    { customId: "channel", label: "Channel ID", style: TextInputStyle.Short, placeholder: "Enter the channel ID where the join to create system will listen to." },
    { customId: "userlimit", label: "User Limit", style: TextInputStyle.Short, placeholder: "Enter the user limit for the join to create channel (1-99)." }
]

function getModal(action) {
    return {
        customId: `jointocreate-${action}`,
        title: `Join to Create - ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        fields: joinToCreateFields
    };
}

module.exports = {
    name: "jointocreate",
    getModal,
    fields: joinToCreateFields,
    updateFields: (values) => {
        values.userlimit = parseInt(values["userlimit"]);

        if (values["userlimit"] > 99 || values["userlimit"] < 1) throw new Error("`❌` User limit must be between 1 and 99.");
        return {
            enabled: true,
            ChannelID: values["channel"],
            UserLimit: values["userlimit"]
        };
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` Successfully set up the Join to Create system in <#${values.ChannelID}> with a user limit of ${values.UserLimit}.`,
        editSuccess: (values) => `\`✅\` Successfully updated the Join to Create system in <#${values.ChannelID}> with a user limit of ${values.UserLimit}.`
    }
}