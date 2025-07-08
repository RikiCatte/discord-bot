const { EmbedBuilder, ModalSubmitInteraction, MessageFlags } = require("discord.js");
const frmtDate = require("../../utils/formattedDate");
const BotConfig = require("../../schemas/BotConfig");
const msgConfig = require("../../messageConfig.json");

/**
 * 
 * @param {Client} client 
 * @param {ModalSubmitInteraction} interaction 
 * @returns 
 */
module.exports = async (client, interaction) => {
    if (!interaction.isModalSubmit() || interaction.customId !== "captchaModal") return;

    const config = await BotConfig.findOne({ GuildID: msgConfig.guild });
    const serviceConfig = config?.services?.captcha;
    if (!serviceConfig || !serviceConfig.enabled) return;

    const verifiedRoleId = serviceConfig.RoleID;
    const captchaGuild = await client.guilds.fetch(msgConfig.guild);
    const verifiedRole = await captchaGuild.roles.cache.get(verifiedRoleId);
    const member = await captchaGuild.members.fetch(interaction.user.id);

    let userData = serviceConfig.users?.find(u => u.UserID === interaction.user.id);
    if (!userData) return await interaction.reply({ content: "There was an error while searching your captcha data, please contact a server admin", flags: MessageFlags.Ephemeral });

    let captcha = userData.Captcha;

    const answer = interaction.fields.getTextInputValue("answer");
    const logChannel = await client.channels.cache.get(serviceConfig.LogChannelID);

    if (answer != `${captcha}`) {
        const embed = new EmbedBuilder()
            .setTitle("User Missed Captcha Verification")
            .setColor("Red")
            .addFields({ name: "User", value: `${interaction.user} (${interaction.user.id})`, inline: false })
            .addFields({ name: "User Answer", value: `${answer}`, inline: true })
            .addFields({ name: "Correct Answer", value: `${captcha}`, inline: true })
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
            .setTimestamp();

        await logChannel.send({ embeds: [embed] });

        userData.MissedTimes = (userData.MissedTimes != null ? userData.MissedTimes + 1 : 1);
        await config.save();

        return await interaction.reply({ content: "\`❌\` That was wrong!, please try again", flags: MessageFlags.Ephemeral });
    }

    await member.roles.add(verifiedRole).catch(async err => {
        console.log(err);
        await interaction.reply({ content: "\`🔴\` There was an error while attempting to add you the verified role, please contact server staff to solve!", flags: MessageFlags.Ephemeral });
        return;
    });

    if (interaction.replied || interaction.deferred) return; // avoid replying again if already replied or deferred

    const embed = new EmbedBuilder()
        .setTitle("User Passed Captcha Verification")
        .setColor("Green")
        .addFields({ name: "User", value: `${interaction.user} (${interaction.user.id})`, inline: false })
        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
        .setTimestamp();

    await logChannel.send({ embeds: [embed] });

    userData.CaptchaStatus = "Submitted";
    userData.CaptchaExpired = true;
    await config.save();

    let verifyMsg;
    if (userData.Bypassed) {
        verifyMsg = `You got verification bypassed by user id ${userData.BypassedBy} in **${member.guild.name}** on \`${await frmtDate()} UTC +1/2\``;
    } else {
        verifyMsg = `You got verified in **${member.guild.name}** on \`${await frmtDate()} UTC +1/2\``;
    }

    await interaction.reply({ content: "\`✅\` " + verifyMsg });
}