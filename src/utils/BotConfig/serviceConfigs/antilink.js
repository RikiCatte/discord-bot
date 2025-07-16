const antilinkPermissionOptions = [
    { label: "Manage Channels", value: "ManageChannels", emoji: "📁" },
    { label: "Manage Server", value: "ManageGuild", emoji: "🏢" },
    { label: "Embed Links", value: "EmbedLinks", emoji: "🔗" },
    { label: "Attach Files", value: "AttachFiles", emoji: "📎" },
    { label: "Manage Messages", value: "ManageMessages", emoji: "📝" },
    { label: "Administrator", value: "Administrator", emoji: "🛡️" }
];

function getSelectMenu(action) {
    return {
        customId: action === "enable" ? "antilink-permission-setup" : "antilink-permission-edit",
        placeholder: "",
        options: antilinkPermissionOptions,
        content: action === "enable"
            ? "Select a permission to bypass AntiLink system:"
            : "Select the new permission to bypass the AntiLink system:"
    };
}

module.exports = {
    name: "antilink",
    getSelectMenu,
    updateFields: (permission) => ({ enabled: true, Permissions: permission }),
    replyStrings: {
        setupSuccess: (permission) => `\`✅\` Permission set to \`${permission}\``,
        editSuccess: (permission) => `\`✅\` Permission updated to \`${permission}\``
    }
};