const { CaptchaGenerator } = require("captcha-canvas");
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ButtonStyle, TextInputStyle, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, MessageFlags } = require("discord.js");
const captchaSchema = require("../../schemas/captchaSetup");
const captchaUsersDataSchema = require("../../schemas/captchaUsersData");
const msgConfig = require("../../messageConfig.json");
const rndStr = require("../../utils/randomString");
const frmtDate = require("../../utils/formattedDate");
const { secsToMs, msToSecs } = require("../../utils/timeUtils");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("captcha")
        .setDescription("Setup the CAPTCHA verification system")
        .addSubcommand(command =>
            command
                .setName("setup")
                .setDescription("Setup the CAPTCHA verification system")
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("The role you want to be given on verification")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option
                        .setName("limit")
                        .setDescription("The number of times that one user can rejoin the server")
                        .setRequired(true)
                )
                .addStringOption((o) =>
                    o
                        .setName("time")
                        .setDescription("The time to make automatically expire the CAPTCHA.")
                        .setChoices(
                            { name: "60 Seconds", value: `${60}` },
                            { name: "5 Minutes", value: `${60 * 5}` },
                            { name: "10 Minutes", value: `${60 * 10}` },
                            { name: "1 Hour", value: `${60 * 60}` },
                            { name: "1 Day", value: `${60 * 60 * 24}` }
                        )
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("text")
                        .setDescription("The CAPTCHA text you want in the CAPTCHA image, leave empty to generate a random text every time")
                        .setRequired(false)
                )
        )
        .addSubcommand(command =>
            command
                .setName("disable")
                .setDescription("Disable the CAPTCHA verification system")
        )
        .addSubcommand(command =>
            command
                .setName("resend")
                .setDescription("Resend the CAPTCHA verification to a specific user (if it's expired)")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("The user you want to resend the CAPTCHA verification")
                        .setRequired(true)
                )
        )
        .addSubcommand(command =>
            command
                .setName("bypass")
                .setDescription("Bypass the CAPTCHA verification for a specific user")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("The user you want to bypass the CAPTCHA verification")
                        .setRequired(true)
                )
        )
        .addSubcommand(command =>
            command
                .setName("check-system")
                .setDescription("Check the current CAPTCHA system configuration")
        )
        .addSubcommand(command =>
            command
                .setName("check-user")
                .setDescription("Check a specific user CAPTCHA verification status")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("The user you want to bypass the CAPTCHA verification")
                        .setRequired(true)
                )
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    /**
     * 
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction 
     * @returns 
     */
    run: async (client, interaction) => {
        const data = await captchaSchema.findOne({ Guild: interaction.guild.id });
        let embed, role, user, userData;

        const { options } = interaction;
        const subcommand = options.getSubcommand();

        switch (subcommand) {
            case "setup":

                if (data) return await interaction.reply({ content: "The captcha system is already on!", flags: MessageFlags.Ephemeral });
                const limit = options.getInteger("limit");
                let time = options.getString("time");
                let msecs = await secsToMs(time); // time in milliseconds
                console.log("msecs: ", msecs)

                let captchaText = options.getString("text"), random = false;
                if (!captchaText) {
                    captchaText = "Random"; random = true;
                }

                await captchaSchema.create({
                    Guild: interaction.guild.id,
                    Role: role.id,
                    ReJoinLimit: limit,
                    RandomText: random,
                    ExpireInMS: msecs,
                    Captcha: captchaText
                })

                embed = new EmbedBuilder()
                    .setColor("Blue")
                    .setDescription(`\`✅\` The captcha system has been **set!**`)

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

                break;
            case "resend":
                user = options.getUser("user");

                if (!data) return await interaction.reply({ content: "There is no captcha verification system set here!", flags: MessageFlags.Ephemeral });

                userData = await captchaUsersDataSchema.findOne({ Guild: interaction.guild.id, UserID: user.id });

                if (!userData) return await interaction.reply({ content: `Unable to find ${user}'s CAPTCHA in the DB`, flags: MessageFlags.Ephemeral });

                if (userData.CaptchaExpired) {
                    const data = await captchaSchema.findOne({ Guild: interaction.guild.id });

                    let text = "", length;
                    if (data.RandomText) { // randomize captcha text
                        length = Math.floor(Math.random() * 8) + 5; // string between 5 and 12 chars (both included)
                        text = await rndStr(length);
                    } else {
                        text = data.Captcha;
                    }

                    // mettere scaduto a false e aggiungere campo "Resent" (Boolean) e "ResentBy" (String) -- aggiungere questi campi allo schema
                    await captchaUsersDataSchema.findOneAndUpdate(
                        { Guild: interaction.guild.id, UserID: user.id },
                        {
                            $set: {
                                Captcha: text,
                                CaptchaStatus: "Pending",
                                CaptchaExpired: false,
                                Resent: true,
                                ResentBy: interaction.user.id
                            }
                        }
                    );

                    // Send the new captcha
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
                        .addFields({ name: "🇮🇹", value: `Compila il Captcha per entrare nel server ${interaction.guild.name}` })
                        .addFields({ name: "🇬🇧", value: `Complete Captcha to gain access to the server ${interaction.guild.name}` })
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

                    const msg = await user.send({ embeds: [capEmbed, alertEmbed], files: [attachment], components: [captchaButton] }).catch(err => {
                        return console.log(err);
                    })

                    const collector = msg.createMessageComponentCollector({ time: data.ExpireInMS });

                    collector.on("collect", async i => {
                        if (i.customId === "captchaButton") {
                            i.showModal(captchaModal);
                        }
                    })

                    collector.on("end", async collected => {
                        await captchaUsersDataSchema.findOneAndUpdate(
                            { Guild: interaction.guild.id, UserID: user.id },
                            {
                                $set: {
                                    CaptchaStatus: "Expired due to time limit",
                                    CaptchaExpired: true,
                                }
                            }
                        );

                        await msg.delete().catch(err => console.log(err));
                        return await interaction.member.send({ content: "Your captcha has expired, please contact a server Admin in order to gain the verified role." })
                    })

                    await interaction.reply({ content: `Successfully resent CAPTCHA verification to ${user}`, flags: MessageFlags.Ephemeral });
                } else {
                    return await interaction.reply({ content: `${user}'s CAPTCHA is not expired!`, flags: MessageFlags.Ephemeral });
                }

                break;
            case "disable":
                if (!data) return await interaction.reply({ content: "There is no captcha verification system set here!", flags: MessageFlags.Ephemeral });

                await captchaSchema.deleteMany({ Guild: interaction.guild.id });

                embed = new EmbedBuilder()
                    .setColor("Blue")
                    .setDescription(`\`✅\` The captcha system has been **disabled!**`)

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            case "bypass":
                const bypassUser = options.getUser("user");
                const guildMember = await interaction.guild.members.fetch(bypassUser);

                const schema = await captchaSchema.findOne({ Guild: interaction.guild.id });
                role = schema.Role;

                if (guildMember.roles.cache.has(role)) return await interaction.reply({ content: "❓ This user already has verified role", flags: MessageFlags.Ephemeral });

                await guildMember.roles.add(role).catch(async err => {
                    console.log(err);
                    return await interaction.reply({ content: "🔴 There was an error while attempting to add you the verified role, please contact server staff to solve!", flags: MessageFlags.Ephemeral });
                });

                const userSchema = await captchaUsersDataSchema.findOne({ Guild: interaction.guild.id, UserID: guildMember.id });
                if (!userSchema) return await interaction.reply({ content: `⚠️ User **${guildMember.displayName}** is not listed in the captcha system, he now has the verified role but there will not be a reference in the db`, flags: MessageFlags.Ephemeral });
                await captchaUsersDataSchema.findOneAndUpdate({ Guild: interaction.guild.id, UserID: guildMember.id }, // update mongodb schema with bypassed user data
                    {
                        $set: {
                            Guild: interaction.guild.id,
                            UserID: guildMember.id,
                            Username: guildMember.user.username,
                            JoinedAt: await frmtDate(),
                            ReJoinedTimes: 0,
                            Captcha: null,
                            CaptchaStatus: "Bypassed",
                            CaptchaExpired: null,
                            Bypassed: true,
                            BypassedBy: interaction.user.id
                        }
                    }
                )


                await interaction.reply({ content: `🟢 You bypassed ${guildMember.displayName} (${guildMember.id}) from captcha verification`, flags: MessageFlags.Ephemeral });

                break;
            case "check-system":
                const data = await captchaSchema.findOne({ Guild: interaction.guild.id });
                if (!data) return await interaction.reply({ content: "There is no captcha verification system set here!", flags: MessageFlags.Ephemeral });


                embed = new EmbedBuilder()
                    .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                    .setColor("Blue")
                    .setTitle("Status Of CAPTCHA Verification System")
                    .setThumbnail(msgConfig.thumbnail)
                    .addFields({ name: "Status", value: "Enabled", inline: true })
                    .addFields({ name: "Verified Role", value: `<@${data.Role}>`, inline: true })
                    .addFields({ name: "Rejoin Limit per User", value: `${data.ReJoinLimit}`, inline: false })
                    .addFields({ name: "CAPTCHA Expire Time (in seconds)", value: `${await msToSecs(data.ExpireInMS)}`, inline: true })
                    .addFields({ name: "CAPTCHA Solution", value: `||${data.Captcha}||`, inline: false })
                    .setFooter({ text: "Captcha System by RikiCatte", iconURL: msgConfig.footer_iconURL })

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            case "check-user":
                user = options.getUser("user");
                userData = await captchaUsersDataSchema.findOne({ Guild: interaction.guild.id, UserID: user.id });
                if (!userData) return await interaction.reply({ content: `User **${user}** is not listed in db`, flags: MessageFlags.Ephemeral });

                embed = new EmbedBuilder()
                    .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                    .setColor("Blue")
                    .setTitle(`CAPTCHA Verification Status of ${user.username}`)
                    .setThumbnail(msgConfig.thumbnail)
                    .addFields({ name: "User ID", value: `${user.id}`, inline: true })
                    .addFields({ name: "Joined At", value: `${userData.JoinedAt}`, inline: true })
                    .addFields({ name: "Rejoined Times", value: `${userData.ReJoinedTimes}` ?? "null", inline: true })
                    .addFields({ name: "CAPTCHA Solution", value: `||${userData.Captcha}||`, inline: false })
                    .addFields({ name: "CAPTCHA Status", value: `${userData.CaptchaStatus}`, inline: true })
                    .addFields({ name: "Captcha Expired", value: `${userData.CaptchaExpired}`, inline: true })
                    .addFields({ name: "Missed CAPTCHAs", value: `${userData.MissedTimes}`, inline: false })
                    .addFields({ name: "Resent?", value: `${userData.Resent}`, inline: true })
                    .addFields({ name: "Resent By", value: `${userData.ResentBy}`, inline: true })
                    .addFields({ name: "Bypassed?", value: `${userData.Bypassed}`, inline: false })
                    .addFields({ name: "Bypassed By", value: `${userData.BypassedBy}`, inline: true })
                    .setFooter({ text: "Captcha System by RikiCatte", iconURL: msgConfig.footer_iconURL })

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
        }
    }
}