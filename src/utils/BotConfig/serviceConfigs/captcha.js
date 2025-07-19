const { TextInputStyle } = require("discord.js");

const captchaFields = [
    { customId: "roleID", label: "Role ID to assign after captcha verification", style: TextInputStyle.Short, placeholder: "Input the role ID" },
    { customId: "logChannelID", label: "Log Channel ID", style: TextInputStyle.Short, placeholder: "Input the log channel ID" },
    { customId: "reJoinLimit", label: "Rejoin Limit", style: TextInputStyle.Short, placeholder: "Number of rejoin attempts before kick", value: "3" },
    { customId: "expireInMS", label: "Captcha Expiration Time (ms)", style: TextInputStyle.Short, placeholder: "600000 (10 minutes)", value: "600000" },
    { customId: "captchaText", label: "Captcha Text (type Random for random)", style: TextInputStyle.Paragraph, placeholder: "Type the captcha text here" }
];

function getModal(action) {
    return {
        customId: action === "enable" ? "captcha-setup" : "captcha-edit",
        title: action === "enable" ? "Setup Captcha" : "Edit Captcha",
        fields: captchaFields,
    };
}

module.exports = {
    name: "captcha",
    getModal,
    fields: captchaFields,
    updateFields: (values) => ({
        enabled: true,
        RoleID: values.roleID,
        LogChannelID: values.logChannelID,
        ReJoinLimit: parseInt(values.reJoinLimit),
        ExpireInMS: parseInt(values.expireInMS),
        Captcha: values.captchaText
    }),
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`captcha\` service succesfully **ENABLED** with role <@&${values.roleID}>, captcha logs will be sent in <#${values.logChannelID}>`,
        editSuccess: (values) => `\`✅\` \`captcha\` service succesfully **UPDATED** with role <@&${values.roleID}>, captcha logs will be now sent in <#${values.logChannelID}>`
    }
}