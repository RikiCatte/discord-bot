const bugReportSchema = require("../schemas/bugreport");

module.exports = {
    customId: "bugSolved",
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const { message } = interaction;

        if (interaction.customId) {
            if (interaction.customId.includes("bugSolved - ")) {
                let data = await bugReportSchema.findOne({ GuildID: interaction.guild.id, ReportID: message.id });
                if (!data) return await interaction.reply({ content: "❌ This report was not found in the database", ephemeral: true });

                let stringId = interaction.customId;
                stringId = stringId.replace("bugSolved - ", "");

                let member = await client.users.fetch(stringId);

                await bugReportSchema.updateOne({ GuildID: interaction.guild.id, ReportID: message.id }, { Solved: true, FixedBy: interaction.user.id });

                await member.send("✅ This message was initialized by the DEVs indicating that the bug you reported has been solved.").catch(err => { console.log(err) });
                await interaction.reply({ content: "✅ Member was notified that the issue has been fixed", ephemeral: true })
                await interaction.message.delete().catch(err => { console.log(err) });
            }
        }
    },
};