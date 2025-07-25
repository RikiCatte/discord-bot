const { TextInputStyle, AttachmentBuilder } = require("discord.js");
const generateGreetingCard = require("./helper-functions/greeting/generateGreetingCard");

const greetingFields = (type) => [
    { customId: `${type.toLowerCase()}-channel`, label: `${type} Channel ID`, style: TextInputStyle.Short, placeholder: "123456789012345678" },
    { customId: `${type.toLowerCase()}-presenceStatus`, label: `${type} Presence Status`, style: TextInputStyle.Short, placeholder: "Choose one of these states: online, idle, offline, dnd, invisible, streaming, phone" },
    { customId: `${type.toLowerCase()}-bordercolor`, label: `${type} Border Color`, style: TextInputStyle.Short, placeholder: "#FFFFFF Or input \"Random\" for random Border Color" },
    { customId: `${type.toLowerCase()}-message`, label: `${type} Message`, style: TextInputStyle.Paragraph, placeholder: type === "Welcome" ? "Hey! <user>" : "Bye! <user>" },
    { customId: `${type.toLowerCase()}-replyMessage`, label: `${type} Reply Message`, style: TextInputStyle.Paragraph, placeholder: type === "Welcome" ? "<user> Welcome and have fun on our server!" : "<user> Goodbye! We will miss you!" },
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
    const presenceStatus = values[`${type.toLowerCase()}-presenceStatus`] || "online";
    const borderColor = values[`${type.toLowerCase()}-bordercolor`] || "#FFFFFF";
    const message = values[`${type.toLowerCase()}-message`] || (type === "Welcome" ? "Hey! <user>" : "Bye! <user>");

    const imageBuffer = await generateGreetingCard(user, presenceStatus, borderColor, message);
    const attachment = new AttachmentBuilder(imageBuffer, { name: "greeting-preview.png" });

    return { content: "Preview:", files: [attachment] };
}

module.exports = {
    name: "greeting",
    configTypes: ["Welcome", "Goodbye"],
    getModal,
    fields: greetingFields,
    updateFields: (type, values) => {
        const borderColor = values[`${type.toLowerCase()}-bordercolor`] || "#FFFFFF";
        const hex = borderColor.replace(/^#/, "");
        if (!/^[0-9A-F]{6}$/i.test(hex) && borderColor.toLowerCase() !== "random") throw new Error("`❌` The border color must be a valid HEX-code (e.g. #FFFFFF) or it must be equal to \"Random\"");
        return {
            enabled: true,
            [type]: {
                Enabled: true,
                ChannelID: values[`${type.toLowerCase()}-channel`],
                PresenceStatus: values[`${type.toLowerCase()}-presenceStatus`],
                BorderColor: borderColor.toLowerCase() === "random"
                    ? "Random"
                    : (borderColor.startsWith("#") ? borderColor : `#${borderColor}`),
                Message: values[`${type.toLowerCase()}-message`],
                ReplyMessage: values[`${type.toLowerCase()}-replyMessage`]
            }
        };
    },
    getPreview: getPreviewCard,
    replyStrings: {
        setupSuccess: (type) => `\`✅\` \`greeting\` service for **${type}** Configuration successfully **ENABLED**!`,
        editSuccess: (type) => `\`✅\` \`greeting\` service for **${type}** Configuration successfully **UPDATED**!`
    }
};