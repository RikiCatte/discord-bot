const { TextInputStyle, ChannelType } = require("discord.js");

const logsFields = [
    {
        customId: "LogChannelID",
        label: "Log Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Input the channel ID where server logs will be sent",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "StaffChannelID",
        label: "Staff Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Input the staff channel ID, relevant events will also be sent here",
        minLength: 18,
        maxLength: 19,
        required: true
    }
];

function getModal(action) {
    return {
        customId: action === "enable" ? "log-system-setup" : "log-system-edit",
        title: action === "enable" ? "Enable Bot Log System" : "Edit Bot Log System",
        fields: logsFields,
    };
}

module.exports = {
    name: "logs",
    getModal,
    fields: logsFields,
    updateFields: (values) => ({
        enabled: true,
        LogChannelID: values.LogChannelID,
        StaffChannelID: values.StaffChannelID
    }),
    validateInput: async (interaction, updated) => {
        const logChannel = interaction.guild.channels.cache.get(updated.LogChannelID);
        if (!logChannel || logChannel.type !== ChannelType.GuildText && logChannel.type !== ChannelType.GuildAnnouncement) 
            throw new Error("`❌` The log channel ID you entered does not exist or is not a text or announcement channel.");
        
        const staffChannel = interaction.guild.channels.cache.get(updated.StaffChannelID);
        if (!staffChannel || staffChannel.type !== ChannelType.GuildText && staffChannel.type !== ChannelType.GuildAnnouncement) 
            throw new Error("`❌` The staff channel ID you entered does not exist or is not a text or announcement channel.");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`logs\` service successfully **ENABLED**, logs will be sent to <#${values.LogChannelID}> and relevant events to <#${values.StaffChannelID}>.`,
        editSuccess: (values) => `\`✅\` \`logs\` service successfully **UPDATED**, logs will now be sent to <#${values.LogChannelID}> and relevant events to <#${values.StaffChannelID}>.`
    }
}