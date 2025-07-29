const { TextInputStyle } = require("discord.js");

const nitroboostFields = [
    { 
        customId: "channelID", 
        label: "The channel ID", 
        style: TextInputStyle.Short, 
        placeholder: "Input the channel ID",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    { 
        customId: "embedColor", 
        label: "Embed Color (HEX)", 
        style: TextInputStyle.Short, 
        placeholder: "#f47fff",
        minLength: 6,
        maxLength: 7,
        required: true
    },
    { 
        customId: "embedTitle", 
        label: "Embed Title", 
        style: TextInputStyle.Short, 
        placeholder: "New Booster 🎉",
        minLength: 1,
        maxLength: 256,
        required: true
    },
    { 
        customId: "embedMessage", 
        label: "Embed Message", 
        style: TextInputStyle.Paragraph, 
        placeholder: "Thank you for boosting the server! Use [m] to ping the booster.",
        minLength: 1,
        maxLength: 2048,
        required: true
    },
    { 
        customId: "boostMessage", 
        label: "Boost Message", 
        style: TextInputStyle.Paragraph, 
        placeholder: "Thanks for boosting [m]! Use [m] to ping the booster.",
        minLength: 1,
        maxLength: 2048,
        required: true
    }
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
    validateInput: async (interaction, updated) => {
        const channel = interaction.guild.channels.cache.get(updated.channelID);
        if (!channel) throw new Error("`❌` The channel ID you entered does not exist in this server.");

        if (!/^#?[0-9A-Fa-f]{6}$/.test(updated.embedColor)) throw new Error("`❌` Embed color must be a valid HEX color code (e.g., #f47fff).");

        if (updated.embedTitle.length < 1 || updated.embedTitle.length > 256) throw new Error("`❌` Embed title must be between 1 and 256 characters.");

        if (updated.embedMessage.length < 1 || updated.embedMessage.length > 2048) throw new Error("`❌` Embed message must be between 1 and 2048 characters.");

        if (updated.boostMessage.length < 1 || updated.boostMessage.length > 2048) throw new Error("`❌` Boost message must be between 1 and 2048 characters.");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`nitroboost\` service succesfully **ENABLED**, when someone boosts the server the message will be sent in <#${values.channelID}>`,
        editSuccess: (values) => `\`✅\` \`nitroboost\` service succesfully **UPDATED**, when someone boosts the server the message will be sent in <#${values.channelID}>`
    }
};