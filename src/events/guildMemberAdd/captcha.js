const { CaptchaGenerator } = require("captcha-canvas");
const { AttachmentBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, ButtonStyle, TextInputStyle, GuildMember } = require("discord.js");
const captchaSchema = require("../../schemas/captchaSetup");
const captchaUsersDataSchema = require("../../schemas/captchaUsersData");
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
    const data = await captchaSchema.findOne({ Guild: member.guild.id });
    if (!data) return; // captcha system disabled

    const userData = await captchaUsersDataSchema.findOne({ Guild: member.guild.id, UserID: member.user.id });

    let text = "", length;
    if (!userData) { // user never joined the server before so we create a new schema
        if (data.RandomText) { // randomize captcha text
            length = Math.floor(Math.random() * 8) + 5; // string between 5 and 12 chars (both included)
            text = await rndStr(length);
        } else {
            text = data.Captcha;
        }

        await captchaUsersDataSchema.create({
            Guild: member.guild.id,
            UserID: member.user.id,
            Username: member.user.username,
            JoinedAt: await frmtDate(),
            ReJoinedTimes: 0,
            Captcha: text,
            CaptchaStatus: "Pending",
            CaptchaExpired: false
        })
    } else { // member has joined server in the past

        if (data.RandomText) { // randomize captcha text
            length = Math.floor(Math.random() * 8) + 5; // string between 5 and 12 chars (both included)
            text = await rndStr(length);
        } else {
            text = data.Captcha;
        }

        await captchaUsersDataSchema.findOneAndUpdate(
            { Guild: member.guild.id, UserID: member.user.id },
            {
                $set: {
                    ReJoinedTimes: userData.ReJoinedTimes + 1,
                    Captcha: text
                }
            }
        );

        let staffChannel = client.channels.cache.get(msgConfig.staffChannel);
        if (userData.ReJoinedTimes + 1 >= data.ReJoinLimit) {
            await captchaUsersDataSchema.findOneAndUpdate(
                { Guild: member.guild.id, UserID: member.user.id },
                {
                    $set: {
                        CaptchaStatus: "User Kicked due to rejoin limit exceeded",
                        CaptchaExpired: true,
                    }
                }
            );

            await member.send(`You Re-Joined ${member.guild.name} too many times so you can't receive the verified role! Please contact server Admins.`);
            await staffChannel.send({ content: `@here Warning! User **${member.user.username}** (${member.user.id}) rejoined the server for ${userData.ReJoinedTimes + 1} times!` });
            return await member.kick(`User **${member.user.username}** (${member.user.id}) has been kicked because he/has has rejoined the server ${userData.ReJoinedTimes} !`);
        }

        await staffChannel.send({ content: `@here Warning! User **${member.user.username}** (${member.user.id}) rejoined the server for ${userData.ReJoinedTimes + 1} times!` });
    }

    const captcha = new CaptchaGenerator()
        .setDimension(150, 450)
        .setCaptcha({ text: `${text}`, size: 60, color: "green" })
        .setDecoy({ opacity: 0.5 })
        .setTrace({ color: "green" })

    const buffer = captcha.generateSync();

    const attachment = new AttachmentBuilder(buffer, { name: "captcha.png" });

    const capEmbed = new EmbedBuilder()
        .setColor("Blue")
        .setImage("attachment://captcha.png")
        .setTitle("Captcha Verification System")
        .setDescription("🇮🇹 Attenzione alle maiuscole!\n🇬🇧 The challenge is case-sensitive!")
        .addFields({ name: "🇮🇹", value: `Compila il Captcha per entrare nel server ${member.guild.name}` })
        .addFields({ name: "🇬🇧", value: `Complete Captcha to gain access to the server, it's case-sensitive ${member.guild.name}` })
        .setFooter({ text: "Captcha System by RikiCatte", iconURL: msgConfig.footer_iconURL })


    const endTime = Math.floor((new Date().getTime() + data.ExpireInMS) / 1000);
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

    const collector = msg.createMessageComponentCollector({ time: data.ExpireInMS });

    collector.on("collect", async i => {
        if (i.customId === "captchaButton") {
            i.showModal(captchaModal);
        }
    })

    collector.on("end", async collected => {
        let userCaptcha = await captchaUsersDataSchema.findOne({ Guild: member.guild.id, UserID: member.user.id });

        if (/*userCaptcha.CaptchaStatus &&*/ userCaptcha.CaptchaStatus === "Pending") { // time is finished and the user didn't solved the captcha
            await captchaUsersDataSchema.findOneAndUpdate(
                { Guild: member.guild.id, UserID: member.user.id },
                {
                    $set: {
                        CaptchaStatus: "Expired due to time limit",
                        CaptchaExpired: true,
                    }
                }
            );

            await msg.delete().catch(err => console.log(err));
            return await member.send({ content: `Your captcha has expired, please contact a **${member.guild.name}** Admin in order to gain the verified role.` })
        }

        await msg.delete().catch(err => console.log(err));

        if (userCaptcha.Bypassed) return await member.send({ content: `You get verfication bypassed by user id ${userCaptcha.BypassedBy} in **${member.guild.name}** on \`${await frmtDate()} UTC +1/2\`` });

        // user has correctly submitted captcha and the message will be deleted
        return await member.send({ content: `You get verified in **${member.guild.name}** on \`${await frmtDate()} UTC +1/2\`` });        
    })
}