const { TextInputStyle, ChannelType } = require("discord.js");

const musicFields = [
    {
        customId: "DJRoleID",
        label: "DJ Role ID",
        style: TextInputStyle.Short,
        placeholder: "Role ID for users allowed to control music system.",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "VoiceChannelID",
        label: "Voice Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Enter a VC ID to enable the commandless music system (optional).",
        minLength: 18,
        maxLength: 19,
        required: false
    }
];

function getModal(action) {
    return {
        customId: action === "enable" ? "music-setup" : "music-edit",
        title: action === "enable" ? "Setup Music Service" : "Edit Music Service",
        fields: musicFields
    };
};

module.exports = {
    name: "music",
    getModal,
    fields: musicFields,
    updateFields: (values) => ({
        enabled: true,
        DJRoleID: values.DJRoleID,
        VoiceChannelID: values.VoiceChannelID || null,
        EmbedChannelID: null,
        EmbedMessageID: null,
    }),
    validateInput: async (interaction, updated) => {
        const djRole = interaction.guild.roles.cache.get(updated.DJRoleID);

        if (!djRole) throw new Error("`❌` The DJ role ID does not exist.");

        if (!updated.VoiceChannelID) return; // Voice channel is optional
        const voiceChannel = interaction.guild.channels.cache.get(updated.VoiceChannelID);
        if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) throw new Error("`❌` The Voice Channel ID is invalid or not a voice channel.");
    },
    replyStrings: {
        setupSuccess: (values) => {
            if (values.VoiceChannelID) return `\`✅\` \`music\` service succesfully **ENABLED**. You can now use the music system commands across the guild (use \`/help\` to see the commands). Users with <@&${values.DJRoleID}> role will be able to control the music system. The commandless music system is **enabled** in <#${values.VoiceChannelID}>. Please use \`/music-commandless-setup\` to complete the setup.`;
            else return `\`✅\` \`music\` service succesfully **ENABLED**. You can now use the music system commands across the guild (use \`/help\` to see the commands). Users with <@&${values.DJRoleID}> role will be able to control the music system. The commandless music system is \`disabled\`.`;

        },
        editSuccess: (values) => {
            if (values.VoiceChannelID) return `\`✅\` \`music\` service succesfully **UPDATED**. You can now use the music system commands across the guild (use \`/help\` to see the commands). Users with <@&${values.DJRoleID}> role will be able to control the music system. The commandless music system is **enabled** in <#${values.VoiceChannelID}>. Please use \`/music-commandless-setup\` to complete the setup.`;
            else return `\`✅\` \`music\` service succesfully **UPDATED**. You can now use the music system commands across the guild (use \`/help\` to see the commands). Users with <@&${values.DJRoleID}> role will be able to control the music system. The commandless music system is \`disabled\`.`;
        },
    },
}