const { TextInputStyle, ChannelType } = require("discord.js");

const musicFields = [
    {
        customId: "MusicCommandsChannelID",
        label: "Music Commands Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Channel ID where music commands can be used.",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "MusicVoiceChannelID",
        label: "Music Voice Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Channel ID of the voice channel the bot will join.",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "DJRoleID",
        label: "DJ Role ID",
        style: TextInputStyle.Short,
        placeholder: "Role ID for users allowed to control music system.",
        minLength: 18,
        maxLength: 19,
        required: true
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
        MusicCommandsChannelID: values.MusicCommandsChannelID,
        MusicVoiceChannelID: values.MusicVoiceChannelID,
        DJRoleID: values.DJRoleID
    }),
    validateInput: async (interaction, updated) => {
        const commandsChannel = interaction.guild.channels.cache.get(updated.MusicCommandsChannelID);
        const voiceChannel = interaction.guild.channels.cache.get(updated.MusicVoiceChannelID);
        const djRole = interaction.guild.roles.cache.get(updated.DJRoleID);

        if (!commandsChannel || commandsChannel.type !== ChannelType.GuildText) throw new Error("`❌` The music commands channel ID does not exist or is not a text channel.");
        if (!voiceChannel || (voiceChannel.type !== ChannelType.GuildVoice && voiceChannel.type !== ChannelType.GuildStageVoice)) throw new Error("`❌` The music voice channel ID does not exist or is not a voice/stage channel.");
        if (!djRole) throw new Error("`❌` The DJ role ID does not exist.");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`music\` service succesfully **ENABLED**, you can now use the music system commands across the guild (use \`/help\` to see the commands) you have to use commands in <#${values.MusicCommandsChannelID}>, the bot will join <#${values.MusicVoiceChannelID}> and users with <@&${values.DJRoleID}> role will be able to control the music system.`,
        editSuccess: (values) => `\`✅\` \`music\` service succesfully **UPDATED**, you can now use the music system commands across the guild (use \`/help\` to see the commands) you have to use commands in <#${values.MusicCommandsChannelID}>, the bot will join <#${values.MusicVoiceChannelID}> and users with <@&${values.DJRoleID}> role will be able to control the music system.`,
    },
}