const { TextInputStyle, ChannelType } = require("discord.js");

const captchaFields = [
    {
        customId: "RoleID",
        label: "Role ID to assign after captcha verification",
        style: TextInputStyle.Short,
        placeholder: "Input the role ID",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "LogChannelID",
        label: "Log Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Input the log channel ID",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "ReJoinLimit",
        label: "Rejoin Limit",
        style: TextInputStyle.Short,
        placeholder: "Number of rejoin attempts before kick",
        required: true
    },
    {
        customId: "ExpireInMS",
        label: "Captcha Expiration Time (ms)",
        style: TextInputStyle.Short,
        placeholder: "600000 (10 minutes)",
        required: true
    },
    {
        customId: "Captcha",
        label: "Captcha Text (type Random for random)",
        style: TextInputStyle.Paragraph,
        placeholder: "Type the captcha text here",
        minLength: 4,
        maxLength: 20,
        required: true
    }
];

function getModal(action) {
    return {
        customId: action === "enable" ? "captcha-setup" : "captcha-edit",
        title: action === "enable" ? "Setup Captcha" : "Edit Captcha",
        fields: captchaFields
    };
}

module.exports = {
    name: "captcha",
    getModal,
    fields: captchaFields,
    updateFields: (values) => ({
        enabled: true,
        RoleID: values.RoleID,
        LogChannelID: values.LogChannelID,
        ReJoinLimit: parseInt(values.ReJoinLimit),
        ExpireInMS: parseInt(values.ExpireInMS),
        Captcha: values.Captcha
    }),
    validateInput: async (interaction, updated) => {
        const roleID = updated.RoleID;
        const logChannelID = updated.LogChannelID;

        const role = interaction.guild.roles.cache.get(roleID);
        if (!role) throw new Error("`❌` The role ID you entered does not exist in this server.");

        const logChannel = interaction.guild.channels.cache.get(logChannelID);
        if (!logChannel || logChannel.type !== ChannelType.GuildText) throw new Error("`❌` The log channel ID you entered does not exist or is not a text channel.");

        const reJoinLimit = parseInt(updated.ReJoinLimit);
        if (isNaN(reJoinLimit) || reJoinLimit < 0) throw new Error("`❌` Rejoin limit must be a valid non-negative number.");

        const expireInMS = parseInt(updated.ExpireInMS);
        if (isNaN(expireInMS) || expireInMS <= 10000) throw new Error("`❌` Expiration time must be a valid number greater than 10 seconds (10000 ms).");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`captcha\` service succesfully **ENABLED** with role <@&${values.RoleID}>, captcha logs will be sent in <#${values.LogChannelID}>`,
        editSuccess: (values) => `\`✅\` \`captcha\` service succesfully **UPDATED** with role <@&${values.RoleID}>, captcha logs will be now sent in <#${values.LogChannelID}>`
    }
}