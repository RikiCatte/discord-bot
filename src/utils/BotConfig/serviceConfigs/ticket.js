const { TextInputStyle, ChannelType } = require("discord.js");

const ticketSetupFields = [
    {
        customId: "Channel",
        label: "Ticket Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Channel ID where the ticket embed will be sent.",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "Category",
        label: "Ticket Category ID",
        style: TextInputStyle.Short,
        placeholder: "Category ID where ticket channels will be created.",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "Transcripts",
        label: "Transcripts Channel ID",
        style: TextInputStyle.Short,
        placeholder: "Channel ID for ticket transcripts.",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "Handlers",
        label: "Staff Role ID",
        style: TextInputStyle.Short,
        placeholder: "Role ID of server staff.",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "Everyone",
        label: "Everyone Role ID",
        style: TextInputStyle.Short,
        placeholder: "Role ID for @everyone.",
        minLength: 18,
        maxLength: 19,
        required: true
    },
    {
        customId: "Description",
        label: "Ticket Embed Description",
        style: TextInputStyle.Paragraph,
        placeholder: "Description for the ticket embed.",
        minLength: 5,
        maxLength: 500,
        required: true
    },
    {
        customId: "EmbedColor",
        label: "Ticket Embed Color",
        style: TextInputStyle.Short,
        placeholder: "Color for the ticket embed (e.g. #00ff00 or Green).",
        minLength: 3,
        maxLength: 10,
        required: true
    },
    {
        customId: "TicketCategories",
        label: "Ticket Categories",
        style: TextInputStyle.Paragraph,
        placeholder: "Categories separated by commas. Example: Support, Bug Report, General Inquiry",
        minLength: 1,
        maxLength: 200,
        required: true
    },
    {
        customId: "Emojis",
        label: "Emojis",
        style: TextInputStyle.Paragraph,
        placeholder: "Emojis separated by commas (default emojis only). Example: 🎫, ❓, 🛠️",
        minLength: 1,
        maxLength: 100,
        required: true
    }
];

function getModal(action) {
    return {
        customId: action === "enable" ? "ticket-setup" : "ticket-edit",
        title: action === "enable" ? "Setup Ticket System" : "Edit Ticket System",
        fields: ticketSetupFields
    };
}

module.exports = {
    name: "ticket",
    getModal,
    fields: ticketSetupFields,
    updateFields: (values) => ({
        enabled: true,
        Channel: values.Channel,
        Category: values.Category,
        Transcripts: values.Transcripts,
        Handlers: values.Handlers,
        Everyone: values.Everyone,
        Description: values.Description,
        EmbedColor: values.EmbedColor,
        CustomId: ["ticket-stringMenu"],
        TicketCategories: values.TicketCategories.split(",").map(c => c.trim()),
        MessageId: "",
        Emojis: values.Emojis.split(",").map(e => e.trim()),
        CategoriesEmojiArray: values.TicketCategories.split(",").map((category, index) => ({
            category: category.trim(),
            emoji: values.Emojis.split(",")[index % values.Emojis.split(",").length].trim()
        })),
    }),
    validateInput: async (interaction, updated) => {
        const channel = interaction.guild.channels.cache.get(updated.Channel);
        const category = interaction.guild.channels.cache.get(updated.Category);
        const transcripts = interaction.guild.channels.cache.get(updated.Transcripts);
        const handlers = interaction.guild.roles.cache.get(updated.Handlers);
        const everyone = interaction.guild.roles.cache.get(updated.Everyone);

        if (!channel || channel.type !== ChannelType.GuildText) throw new Error("`❌` The ticket channel ID does not exist or is not a text channel.");
        if (!category || category.type !== ChannelType.GuildCategory) throw new Error("`❌` The ticket category ID does not exist or is not a category.");
        if (!transcripts || transcripts.type !== ChannelType.GuildText) throw new Error("`❌` The transcripts channel ID does not exist or is not a text channel.");
        if (!handlers) throw new Error("`❌` The handlers role ID does not exist.");
        if (!everyone) throw new Error("`❌` The everyone role ID does not exist.");

        const categories = updated.TicketCategories;
        const emojis = updated.Emojis;
        if (!categories.length) throw new Error("`❌` You must provide at least one ticket category.");
        if (!emojis.length) throw new Error("`❌` You must provide at least one emoji.");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` Ticket system successfully set up in <#${values.Channel}>. Please run \`/ticket-sendembed\` command to send the embed message.`,
        editSuccess: (values) => `\`✅\` Ticket system successfully updated in <#${values.Channel}>. Please run \`/ticket-sendembed\` command to send the updated embed message.`
    }
}