const { EmbedBuilder, ModalSubmitInteraction, MessageFlags } = require("discord.js");
const { formattedDate } = require("../../utils/utils.js");
const BotConfig = require("../../schemas/BotConfig");
const msgConfig = require("../../messageConfig.json")
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");

/**
 * 
 * @param {Client} client 
 * @param {ModalSubmitInteraction} interaction 
 * @returns 
 */
module.exports = async (client, interaction) => {
    if (!interaction.isModalSubmit() || interaction.customId !== "captchaModal") return;

    let userData;
    let config;
    let serviceConfig;

    const configs = await BotConfig.find({ "services.captcha.Enabled": true });
    for (const conf of configs) {
        const captchaService = conf.services?.captcha;
        if (!captchaService) continue;
        const found = captchaService.users?.find(u => u.UserID === interaction.user.id);
        if (found) {
            userData = found;
            config = conf;
            serviceConfig = captchaService;
            break;
        }
    }

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
        await updateServiceConfig(config, "captcha", { users: serviceConfig.users });

        return await interaction.reply({ content: "\`❌\` That was wrong!, please try again", flags: MessageFlags.Ephemeral });
    }

    const captchaGuild = await client.guilds.fetch(config.GuildID);
    const verifiedRole = captchaGuild.roles.cache.get(serviceConfig.RoleID);

    let member;
    try {
        member = await captchaGuild.members.fetch(interaction.user.id);
    } catch (err) {
        return await interaction.reply({
            content: "Impossibile trovarti nel server. Forse hai lasciato il server?",
            flags: MessageFlags.Ephemeral
        });
    }

    await member.roles.add(verifiedRole).catch(async err => {
        console.log(err);
        await interaction.reply({
            content: "\`🔴\` There was an error while attempting to add you the verified role, please contact server staff to solve!",
            flags: MessageFlags.Ephemeral
        });
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
    await updateServiceConfig(config, "captcha", { users: serviceConfig.users });

    let verifyMsg;
    if (userData.Bypassed)
        verifyMsg = `You got verification bypassed by user id ${userData.BypassedBy} in **${member.guild.name}** on \`${formattedDate()} UTC +1/2\``;
    else
        verifyMsg = `You got verified in **${member.guild.name}** on \`${formattedDate()} UTC +1/2\``;

    await interaction.reply({ content: "\`✅\` " + verifyMsg });
}