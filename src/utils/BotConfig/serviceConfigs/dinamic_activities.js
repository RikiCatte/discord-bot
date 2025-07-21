const { TextInputStyle } = require("discord.js");

const dinamicActivitiesFields = [
    { customId: "activities", label: "Activities (comma separated)", style: TextInputStyle.Paragraph, placeholder: "Ping, Server Count, User Count, Current Time, Discord Version" },
    { customId: "status", label: "Status", style: TextInputStyle.Short, placeholder: "online, idle, dnd, invisible", value: "dnd" },
    { customId: "interval", label: "Interval (ms)", style: TextInputStyle.Short, placeholder: "10000", value: "10000" }
];

function getModal(action) {
    return {
        customId: action === "enable" ? "dinamic-activities-setup" : "dinamic-activities-edit",
        title: action === "enable" ? "Enable Bot Dinamic Activities" : "Edit Bot Dinamic Activities",
        fields: dinamicActivitiesFields,
    };
}

module.exports = {
    name: "dinamic_activities",
    getModal,
    fields: dinamicActivitiesFields,
    updateFields: (values) => ({
        enabled: true,
        activities: Array.isArray(values.activities)
            ? values.activities
            : values.activities.split(",").map(a => a.trim()),
        status: values.status,
        interval: parseInt(values.interval)
    }),
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`dinamic_activities\` service successfully **ENABLED**, the bot will show activities like: ${values.activities.join(", ")}`,
        editSuccess: (values) => `\`✅\` \`dinamic_activities\` service successfully **UPDATED**, the bot will now show activities like: ${values.activities.join(", ")}`
    }
};