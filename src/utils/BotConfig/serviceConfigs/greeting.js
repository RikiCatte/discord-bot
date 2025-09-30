const { TextInputStyle, AttachmentBuilder, ChannelType } = require("discord.js");
const generateGreetingCard = require("./helper-functions/greeting/generateGreetingCard");

const greetingFields = (type) => [
    {
        customId: `ChannelID`,
        label: `${type} Channel ID`,
        style: TextInputStyle.Short,
        placeholder: "Input the channel ID where the greeting will be sent",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: `PresenceStatus`,
        label: `${type} Presence Status`,
        style: TextInputStyle.Short,
        placeholder: "Choose one of these states: online, idle, offline, dnd, invisible, streaming, phone",
        minLength: 3,
        maxLength: 9,
        required: true
    },
    {
        customId: `BorderColor`,
        label: `${type} Border Color`,
        style: TextInputStyle.Short,
        placeholder: "#FFFFFF Or input \"Random\" for random Border Color",
        minLength: 6,
        maxLength: 7,
        required: true
    },
    {
        customId: `Message`,
        label: `${type} Message`,
        style: TextInputStyle.Paragraph,
        placeholder: type === "Welcome" ? "Hey! <user>" : "Bye! <user>",
        minLength: 1,
        maxLength: 2048,
        required: true
    },
    {
        customId: `EmbedTitle`,
        label: `${type} Embed Title`,
        style: TextInputStyle.Short,
        placeholder: type === "Welcome" ? "👋 Welcome <user>!" : "👋 Goodbye <user>!",
        minLength: 1,
        maxLength: 256,
        required: false
    },
    {
        customId: `EmbedDescription`,
        label: `${type} Embed Description`,
        style: TextInputStyle.Paragraph,
        placeholder: type === "Welcome" ? "We're happy to have you here!" : "Sad to see you go!",
        minLength: 1,
        maxLength: 2048,
        required: false
    },
    {
        customId: `ReplyMessage`,
        label: `${type} Reply Message`,
        style: TextInputStyle.Paragraph,
        placeholder: type === "Welcome" ? "<user> Welcome and have fun on our server!" : "<user> Goodbye! Exit reason: <reason>",
        minLength: 1,
        maxLength: 2048,
        required: true
    },
];

function getModal(action, type) {
    return {
        customId: action === "enable"
            ? `greeting-${type.toLowerCase()}-setup`
            : `greeting-${type.toLowerCase()}-edit`,
        title: action === "enable"
            ? `Enable ${type} Greeting`
            : `Edit ${type} Greeting`,
        fields: greetingFields(type),
    };
}

async function getPreviewCard(type, values, user) {
    const presenceStatus = values.PresenceStatus || "online";
    const borderColor = values.BorderColor || "#FFFFFF";
    const message = values.Message || (type === "Welcome" ? "Hey! <user>" : "Bye! <user>");

    const imageBuffer = await generateGreetingCard(user, presenceStatus, borderColor, message);
    const attachment = new AttachmentBuilder(imageBuffer, { name: "greeting-preview.png" });

    return { content: "Preview:", files: [attachment] };
}

module.exports = {
    name: "greeting",
    configTypes: ["Welcome", "Goodbye"],
    getModal,
    fields: greetingFields,
    updateFields: (type, values) => ({
        enabled: true,
        [type]: {
            Enabled: true,
            ChannelID: values.ChannelID,
            PresenceStatus: values.PresenceStatus,
            BorderColor: values.BorderColor,
            Message: values.Message,
            ReplyMessage: values.ReplyMessage,
            EmbedTitle: values.EmbedTitle,
            EmbedDescription: values.EmbedDescription
        }
    }),
    validateInput: async (interaction, updated, type = "Welcome") => {
        const conf = updated[type] || updated;
        const channelID = conf.ChannelID;
        const channel = await interaction.guild.channels.fetch(channelID);
        if (!channel || channel.type !== ChannelType.GuildText) throw new Error("`❌` The channel ID you entered does not exist or is not a text channel.");

        const presenceStatus = conf.PresenceStatus;
        if (!["online", "idle", "offline", "dnd", "invisible", "streaming", "phone"].includes(presenceStatus)) throw new Error("`❌` Presence status must be one of: online, idle, offline, dnd, invisible, streaming, phone.");

        const borderColor = conf.BorderColor;
        if (!/^[#]?[0-9A-F]{6}$/i.test(borderColor) && borderColor.toLowerCase() !== "random") throw new Error("`❌` The border color must be a valid HEX-code (e.g. #FFFFFF) or it must be equal to \"Random\"");
    },
    getPreview: getPreviewCard,
    replyStrings: {
        setupSuccess: (obj) => {
            const type = Object.keys(obj).find(k => k === "Welcome" || k === "Goodbye") || "Greeting";
            return `\`✅\` \`greeting\` service for **${type}** Configuration successfully **ENABLED**!`;
        },
        editSuccess: (obj) => {
            const type = Object.keys(obj).find(k => k === "Welcome" || k === "Goodbye") || "Greeting";
            return `\`✅\` \`greeting\` service for **${type}** Configuration successfully **UPDATED**!`;
        }
    }
};