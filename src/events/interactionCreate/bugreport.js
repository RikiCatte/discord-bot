const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const msgConfig = require("../../messageConfig.json");
const bugReportSchema = require("../../schemas/bugreport");

module.exports = async (client, interaction) => {
    if (!interaction.guild || !interaction.isModalSubmit()) return;

    if (interaction.customId !== "bugReport") return;

    const channel = await client.channels.cache.get(msgConfig.bugReportsChannel);
    const command = interaction.fields.getTextInputValue("type");
    const description = interaction.fields.getTextInputValue("description");

    const id = interaction.user.id;

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
                .setCustomId(`bugSolved - ${id}`)
                .setStyle(ButtonStyle.Danger)
                .setLabel("🛠 Mark as Fixed")
        )

    let msg = await channel.send({ embeds: [embed], components: [button] }).catch(err => { console.log(err) });

    await bugReportSchema.create({
        GuildID: interaction.guild.id,
        ReportID: msg.id,
        ReportingMemberID: interaction.user.id,
        RepCommand: command,
        RepDescription: description,
        Solved: false,
    })

    return await interaction.reply({ content: "✅ Your report has been sent. Our DEVs will look into this issue, and reach out with any further questions", flags: MessageFlags.Ephemeral });
}