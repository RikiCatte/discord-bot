const { EmbedBuilder, ModalSubmitInteraction, MessageFlags } = require("discord.js");
const captchaSchema = require("../../schemas/captchaSetup");
const captchaUsersDataSchema = require("../../schemas/captchaUsersData");
const msgConfig = require("../../messageConfig.json");

/**
 * 
 * @param {Client} client 
 * @param {ModalSubmitInteraction} interaction 
 * @returns 
 */
module.exports = async (client, interaction) => {
    if (!interaction.isModalSubmit() || interaction.customId !== "captchaModal") return;

    const data = await captchaSchema.findOne({ Guild: `${msgConfig.guild}` });
    if (!data) return;

    const roleId = data.Role;
    const captchaGuild = await client.guilds.fetch(`${msgConfig.guild}`);
    const role = await captchaGuild.roles.cache.get(roleId);

    const member = await captchaGuild.members.fetch(interaction.user.id);

    let userSchema = await captchaUsersDataSchema.findOne({ Guild: msgConfig.guild, UserID: interaction.user.id });
    let captcha = "";
    if (data.RandomText) {
        if (!userSchema) return await interaction.reply("There was an error while searching your captcha data in the database, please contact a server admin");

        captcha = userSchema.Captcha;
    } else {
        captcha = data.Captcha;
    }

    const answer = interaction.fields.getTextInputValue("answer");

    const logChannel = await client.channels.cache.get(`${msgConfig.captchaLogsChannelId}`);
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

        await captchaUsersDataSchema.findOneAndUpdate(
            { Guild: member.guild.id, UserID: member.user.id },
            { $set: { MissedTimes: (userSchema.MissedTimes != null ? userSchema.MissedTimes + 1 : 1) } }
        );
        // if the user miss for the first time userSchema.MissedTimes will be null, so it should be 1 now else it should be incremented

        return await interaction.reply({ content: "❌ That was wrong!, please try again", flags: MessageFlags.Ephemeral });
    }



    await member.roles.add(role).catch(async err => {
        console.log(err);
        return await interaction.reply({ content: "🔴 There was an error while attempting to add you the verified role, please contact server staff to solve!", flags: MessageFlags.Ephemeral });
    });

    const embed = new EmbedBuilder()
        .setTitle("User Passed Captcha Verification")
        .setColor("Green")
        .addFields({ name: "User", value: `${interaction.user} (${interaction.user.id})`, inline: false })
        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
        .setTimestamp();

    await logChannel.send({ embeds: [embed] });

    await captchaUsersDataSchema.findOneAndUpdate(
        { Guild: member.guild.id, UserID: member.user.id },
        {
            $set: {
                CaptchaStatus: "Submitted",
                CaptchaExpired: true
            }
        }
    );

    return await interaction.reply({ content: `✅ You have been verified in ${captchaGuild.name}`, flags: MessageFlags.Ephemeral });
}