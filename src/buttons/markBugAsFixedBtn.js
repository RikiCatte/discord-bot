const { MessageFlags } = require("discord.js");
const BotConfig = require("../schemas/BotConfig");
const replyNoConfigFound = require("../utils/BotConfig/replyNoConfigFound");
const replyServiceNotEnabled = require("../utils/BotConfig/replyServiceNotEnabled");
const updateServiceConfig = require("../utils/BotConfig/updateServiceConfig");

module.exports = {
    customId: "bugSolved",
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        if (!interaction.guild || !interaction.isButton() || !interaction.customId.includes("bugSolved")) return;

        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.bugreport;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "bugreport");
        if (!serviceConfig.enabled) return await replyServiceNotEnabled(interaction, "bugreport");

        const { message } = interaction;

        let stringId = interaction.customId;
        stringId = stringId.replace("bugSolved - ", "");

        let member = await client.users.fetch(stringId);

        if (!member) return await interaction.reply({ content: "\`⚠️\` The user who reported this bug was not found", flags: MessageFlags.Ephemeral });

        serviceConfig.Reports = serviceConfig.Reports || [];
        const report = serviceConfig.Reports.find(r => r.ReportID === message.id);
        if (!report) return await interaction.reply({ content: "\`⚠️\` This report was not found in the database", flags: MessageFlags.Ephemeral });
        report.Solved = true;
        report.FixedBy = interaction.user.id;

        await updateServiceConfig(config, "bugreport", { Reports: serviceConfig.Reports });

        try {
            await member.send("\`✅\` This message was initialized by the DEVs indicating that the bug you reported has been solved.");
        } catch (err) {
            await interaction.reply({ content: `\`⚠️\` User ${member} who reported this bug has DMs disabled, so he was not notified`, flags: MessageFlags.Ephemeral });
            await interaction.message.delete().catch(err => { console.log(err) });
            return;
        }

        await interaction.reply({ content: "\`✅\` Member was notified that the issue has been fixed", flags: MessageFlags.Ephemeral });
        return await interaction.message.delete().catch(err => { console.log(err) });
    },
};