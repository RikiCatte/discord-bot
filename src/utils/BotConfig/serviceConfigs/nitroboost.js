const { TextInputStyle } = require("discord.js");

const nitroboostFields = [
    { customId: "channelID", label: "The channel ID", style: TextInputStyle.Short, placeholder: "Input the channel ID" },
    { customId: "embedColor", label: "Embed Color (HEX)", style: TextInputStyle.Short, placeholder: "#f47fff" },
    { customId: "embedTitle", label: "Embed Title", style: TextInputStyle.Short, placeholder: "New Booster 🎉" },
    { customId: "embedMessage", label: "Embed Message", style: TextInputStyle.Paragraph, placeholder: "Thank you for boosting the server! Use [m] to ping the booster." },
    { customId: "boostMessage", label: "Boost Message", style: TextInputStyle.Paragraph, placeholder: "Thanks for boosting [m]! Use [m] to ping the booster." }
];

function getModal(action) {
    return {
        customId: action === "enable" ? "nitroboost-setup" : "nitroboost-edit",
        title: action === "enable" ? "Setup Nitro Boost" : "Edit Nitro Boost",
        fields: nitroboostFields,
    };
}

module.exports = {
    name: "nitroboost",
    getModal,
    fields: nitroboostFields,
    updateFields: (values) => ({
        enabled: true,
        channelID: values.channelID,
        embedColor: values.embedColor,
        embedTitle: values.embedTitle,
        embedMessage: values.embedMessage,
        boostMessage: values.boostMessage
    }),
    replyStrings: {
        setupSuccess: (values) => `\`✅\` Nitro Boost service setup in <#${values.channelID}>`,
        editSuccess: (values) => `\`✅\` Nitro Boost service updated in <#${values.channelID}>`
    }
};