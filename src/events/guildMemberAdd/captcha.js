const { CaptchaGenerator } = require("captcha-canvas");
const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, TextInputStyle, GuildMember } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const msgConfig = require("../../messageConfig.json");
const frmtDate = require("../../utils/formattedDate");
const rndStr = require("../../utils/randomString");

/**
 * 
 * @param {Client} client 
 * @param {GuildMember} member 
 * @returns 
 */
module.exports = async (client, member) => {
    if (member.bot) return;

    const config = await BotConfig.findOne({ GuildID: member.guild.id });
    const serviceConfig = config?.services?.captcha;

    if (!serviceConfig || !serviceConfig.enabled) return;

    let userData = serviceConfig.users?.find(u => u.UserID === member.id);
    if (!userData) { // user never joined the server before so we create new data for him
        let captchaText = "";
        if (serviceConfig.Captcha && serviceConfig.Captcha.toLowerCase() === "random") {
            const length = Math.floor(Math.random() * 8) + 5;
            captchaText = await rndStr(length);
        } else {
            captchaText = serviceConfig.Captcha;
        }

        userData = {
            UserID: member.id,
            Username: member.user.username,
            JoinedAt: await frmtDate(),
            ReJoinedTimes: 0,
            Captcha: captchaText,
            CaptchaStatus: "Pending",
            CaptchaExpired: false,
            MissedTimes: 0,
            Resent: false,
            ResentBy: null,
            Bypassed: false,
            BypassedBy: null
        };
        serviceConfig.users.push(userData);
        await config.save();
    } else { // member has joined server in the past
        userData.ReJoinedTimes = (userData.ReJoinedTimes || 0) + 1;

        if (serviceConfig.Captcha && serviceConfig.Captcha.toLowerCase() === "random") {
            length = Math.floor(Math.random() * 8) + 5;
            text = await rndStr(length);
        } else {
            text = serviceConfig.Captcha;
        }
        userData.Captcha = text;

        if (userData.ReJoinedTimes >= serviceConfig.ReJoinLimit) {
            userData.CaptchaStatus = "User Kicked due to rejoin limit exceeded";
            userData.CaptchaExpired = true;
            await config.save();

            await member.send(`You Re-Joined ${member.guild.name} too many times so you can't receive the verified role! Please contact server Admins.`);
            return await member.kick(`User **${member.user.username}** (${member.user.id}) has been kicked because he/she has rejoined the server ${userData.ReJoinedTimes} times!`);
        }

        await config.save();

        let logChannel = null;
        if (serviceConfig.LogChannelID) {
            logChannel = client.channels.cache.get(serviceConfig.LogChannelID);
        }

        if (logChannel) {
            await logChannel.send({ content: `@here Warning! User **${member.user.username}** (${member.user.id}) rejoined the server for ${userData.ReJoinedTimes} times!` });
        }
    }

    const captcha = new CaptchaGenerator()
        .setDimension(150, 450)
        .setCaptcha({ text: `${userData.Captcha}`, size: 60, color: "green" })
        .setDecoy({ opacity: 0.5 })
        .setTrace({ color: "green" })

    const buffer = captcha.generateSync();

    const attachment = new AttachmentBuilder(buffer, { name: "captcha.png" });

    const capEmbed = new EmbedBuilder()
        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img, url: msgConfig.author_url })
        .setColor("Blue")
        .setImage("attachment://captcha.png")
        .setTitle("Captcha Verification System")
        .setDescription("🇮🇹 Attenzione alle maiuscole!\n🇬🇧 The challenge is case-sensitive!")
        .addFields({ name: "🇮🇹", value: `Compila il Captcha per entrare nel server ${member.guild.name}` })
        .addFields({ name: "🇬🇧", value: `Complete Captcha to gain access to the server, it's case-sensitive ${member.guild.name}` })
        .setFooter({ text: "Captcha System by RikiCatte", iconURL: msgConfig.footer_iconURL })


    const endTime = Math.floor((new Date().getTime() + serviceConfig.ExpireInMS) / 1000);
    const alertEmbed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle(`\`⚠️\` <t:${endTime}:R> you have to solve the captcha, otherwise you need to contact a server Admin in order to get verification`);

    const captchaButton = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId("captchaButton")
                .setLabel("⚠️ Submit Captcha")
                .setStyle(ButtonStyle.Danger)
        )

    const captchaModal = new ModalBuilder()
        .setTitle("Submit Captcha Answer")
        .setCustomId("captchaModal")

    const answer = new TextInputBuilder()
        .setCustomId("answer")
        .setRequired(true)
        .setLabel("Your Captcha answer")
        .setPlaceholder("Submit what you think the Captcha is! If you get it wrong you can try again")
        .setStyle(TextInputStyle.Short)

    const firstActionRow = new ActionRowBuilder().addComponents(answer);

    captchaModal.addComponents(firstActionRow);

    const msg = await member.send({ embeds: [capEmbed, alertEmbed], files: [attachment], components: [captchaButton] }).catch(err => {
        return console.log(err);
    })

    const collector = msg.createMessageComponentCollector({ time: serviceConfig.ExpireInMS });

    collector.on("collect", async i => {
        if (i.customId === "captchaButton") {
            i.showModal(captchaModal);
        }
    })

    collector.on("end", async collected => {
        const freshConfig = await BotConfig.findOne({ GuildID: member.guild.id });
        let userCaptcha = freshConfig.services?.captcha?.users?.find(u => u.UserID === member.id);

        if (userCaptcha && userCaptcha.CaptchaStatus === "Pending") {
            userCaptcha.CaptchaStatus = "Expired due to time limit";
            userCaptcha.CaptchaExpired = true;
            await freshConfig.save();

            await msg.delete().catch(err => console.log(err));
            return await member.send({ content: `Your captcha has expired, please contact a **${member.guild.name}** Admin in order to gain the verified role.` });
        }

        await msg.delete().catch(err => console.log(err));
    });
}