const { TextInputStyle } = require("discord.js");

const dinamicActivitiesFields = [
    {
        customId: "activities",
        label: "Activities (comma separated)",
        style: TextInputStyle.Paragraph,
        placeholder: "Ping, Server Count, User Count, Current Time, Discord Version",
        required: true
    },
    {
        customId: "status",
        label: "Status",
        style: TextInputStyle.Short,
        placeholder: "online, idle, dnd, invisible",
        minLength: 3,
        maxLength: 9,
        required: true
    },
    {
        customId: "interval",
        label: "Interval (ms)",
        style: TextInputStyle.Short,
        placeholder: "10000",
        required: true
    }
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
    validateInput: async (interaction, updated) => {
        if (!updated.activities || !Array.isArray(updated.activities) && typeof updated.activities !== 'string') throw new Error("`❌` Activities must be a non-empty array or a comma-separated string.");

        if (!["online", "idle", "dnd", "invisible"].includes(updated.status)) throw new Error("`❌` Status must be one of: online, idle, dnd, invisible.");

        if (isNaN(updated.interval) || updated.interval <= 1000) throw new Error("`❌` Interval must be a positive number greater than 1 second (1000 ms).");
    },
    replyStrings: {
        setupSuccess: (values) => `\`✅\` \`dinamic_activities\` service successfully **ENABLED**, the bot will show activities like: ${values.activities.join(", ")} with status \`${values.status}\` every \`${values.interval}\` ms`,
        editSuccess: (values) => `\`✅\` \`dinamic_activities\` service successfully **UPDATED**, the bot will now show activities like: ${values.activities.join(", ")} with status \`${values.status}\` every \`${values.interval}\` ms`
    }
};