const { TextInputStyle } = require("discord.js");

const freeGamesFields = [
    {
        customId: "ChannelID",
        label: "Free games announcement channel ID",
        style: TextInputStyle.Short,
        placeholder: "Enter the channel ID",
        minLength: 18,
        maxLength: 19,
        required: true
    }
];

function getModal(action) {
    return {
        customId: action === "enable" ? "freegames-setup" : "freegames-edit",
        title: action === "enable" ? "Setup Free Games Announcer" : "Edit Free Games Announcer",
        fields: freeGamesFields
    };
}

module.exports = {
    name: "freegames",
    getModal,
    fields: freeGamesFields,
    updateFields: (values) => ({
        enabled: true,
        ChannelID: values.ChannelID,
    }),
    validateInput: async (interaction, updated) => {
        const channel = interaction.guild.channels.cache.get(updated.ChannelID);
        if (!channel) throw new Error("`❌` The channel ID you entered does not exist in this server.");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` Successfully set up the Free Games Announcer in <#${values.ChannelID}>.`,
        editSuccess: (values) => `\`✅\` Successfully updated the Free Games Announcer in <#${values.ChannelID}>.`
    }
}