const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const msgConfig = require("../../messageConfig.json");
const BotConfig = require("../../schemas/BotConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceNotEnabled = require("../../utils/BotConfig/replyServiceNotEnabled");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");

module.exports = async (client, interaction) => {
    if (!interaction.guild || !interaction.isModalSubmit()) return;

    if (interaction.customId !== "bugReport") return;

    const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
    const serviceConfig = config?.services?.bugreport;

    if (!serviceConfig) return await replyNoConfigFound(interaction, "bugreport");
    if (!serviceConfig.enabled) return await replyServiceNotEnabled(interaction, "bugreport");

    const channel = await client.channels.cache.get(serviceConfig.ReportChannelID);
    const command = interaction.fields.getTextInputValue("type");
    const description = interaction.fields.getTextInputValue("description");

    const embed = new EmbedBuilder()
        .setTitle(`\`🐛\` New Bug Report`)
        .setColor("Blurple")
        .addFields({ name: "Reporting Member", value: `${interaction.member} (${interaction.member.id})` })
        .addFields({ name: "Problematic Feature", value: `> ${command}` })
        .addFields({ name: "Report Description", value: `> ${description}` })
        .setTimestamp()
        .setFooter({ text: "Bug Report System", iconURL: msgConfig.footer_iconURL });

    const button = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`bugSolved - ${interaction.user.id}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("🛠 Mark as Fixed")
        )

    let msg = await channel.send({ embeds: [embed], components: [button] }).catch(err => { console.log(err) });

    serviceConfig.Reports = serviceConfig.Reports || [];
    serviceConfig.Reports.push({
        ReportID: msg.id,
        ReportingMemberID: interaction.user.id,
        ReportingCommand: command,
        ReportDescription: description,
        Solved: false,
        FixedBy: null
    });
    await updateServiceConfig(config, "bugreport", { Reports: serviceConfig.Reports });

    return await interaction.reply({ content: "\`✅\` Your report has been sent. Our DEVs will look into this issue, and reach out with any further questions", flags: MessageFlags.Ephemeral });
}