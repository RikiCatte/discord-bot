const { CaptchaGenerator } = require("captcha-canvas");
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ButtonStyle, TextInputStyle, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, MessageFlags } = require("discord.js");
const msgConfig = require("../../messageConfig.json");
const rndStr = require("../../utils/randomString");
const frmtDate = require("../../utils/formattedDate");
const { msToSecs } = require("../../utils/timeUtils");
const BotConfig = require("../../schemas/BotConfig");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("captcha")
        .setDescription("Setup the CAPTCHA verification system")
        .addSubcommand(command =>
            command
                .setName("resend")
                .setDescription("Resend CAPTCHA to user if it's expired or to revoke verified role")
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
        let config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        let serviceConfig = config?.services?.captcha;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "captcha");
        if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "captcha", "disabled", false);

        let embed, role, user, userData, guildMember;

        const { options } = interaction;
        const subcommand = options.getSubcommand();

        switch (subcommand) {
            case "resend":
                user = options.getUser("user");

                userData = serviceConfig.users?.find(u => u.UserID === user.id);

                if (!userData) return await interaction.reply({ content: `\`⚠️\` Unable to find ${user}'s CAPTCHA in the DB`, flags: MessageFlags.Ephemeral });

                guildMember = await interaction.guild.members.fetch(user.id);
                const verifiedRoleId = serviceConfig.RoleID;

                if (guildMember.roles.cache.has(verifiedRoleId)) {
                    const row = new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId("confirm_remove_verified")
                            .setLabel("Remove verified role and resend captcha")
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId("cancel_remove_verified")
                            .setLabel("Cancel")
                            .setStyle(ButtonStyle.Secondary)
                    );

                    await interaction.reply({
                        content: `\`❓\` User ${user} has already the verified role. Do you want to remove it and resend the captcha?`,
                        components: [row],
                        flags: MessageFlags.Ephemeral
                    });

                    const filter = i => i.user.id === interaction.user.id;
                    const confirmation = await interaction.channel.awaitMessageComponent({ filter, time: 30_000 }).catch(() => null);

                    if (!confirmation || confirmation.customId === "cancel_remove_verified") {
                        await interaction.editReply({ content: "Operation aborted.", components: [] });
                        return;
                    }

                    await guildMember.roles.remove(verifiedRoleId).catch(() => { });
                    await interaction.editReply({ content: "Role verified removed. Sending new captcha...", components: [] });
                }

                // This is important to ensure we have the latest data
                config = await BotConfig.findOne({ GuildID: interaction.guild.id });
                serviceConfig = config?.services?.captcha;
                userData = serviceConfig.users?.find(u => u.UserID === user.id);

                if (userData.CaptchaExpired) {
                    let text = "";
                    if (serviceConfig.Captcha && serviceConfig.Captcha.toLowerCase() === "random") {
                        const length = Math.floor(Math.random() * 8) + 5;
                        text = await rndStr(length);
                    } else {
                        text = serviceConfig.Captcha;
                    }

                    userData.Captcha = text;
                    userData.CaptchaStatus = "Pending";
                    userData.CaptchaExpired = false;
                    userData.Resent = true;
                    userData.ResentBy = interaction.user.id;

                    await updateServiceConfig(config, "captcha", { users: serviceConfig.users });

                    // Send the new captcha
                    const captcha = new CaptchaGenerator()
                        .setDimension(150, 450)
                        .setCaptcha({ text: `${text}`, size: 60, color: "green" })
                        .setDecoy({ opacity: 0.5 })
                        .setTrace({ color: "green" });

                    const buffer = captcha.generateSync();

                    const attachment = new AttachmentBuilder(buffer, { name: "captcha.png" });

                    const capEmbed = new EmbedBuilder()
                        .setColor("Blue")
                        .setImage("attachment://captcha.png")
                        .setTitle("Captcha Verification System")
                        .addFields({ name: "🇮🇹", value: `Compila il Captcha per entrare nel server ${interaction.guild.name}` })
                        .addFields({ name: "🇬🇧", value: `Complete Captcha to gain access to the server ${interaction.guild.name}` })
                        .setFooter({ text: "Captcha System by RikiCatte", iconURL: msgConfig.footer_iconURL });

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
                        );

                    const captchaModal = new ModalBuilder()
                        .setTitle("Submit Captcha Answer")
                        .setCustomId("captchaModal");

                    const answer = new TextInputBuilder()
                        .setCustomId("answer")
                        .setRequired(true)
                        .setLabel("Your Captcha answer")
                        .setPlaceholder("Submit what you think the Captcha is! If you get it wrong you can try again")
                        .setStyle(TextInputStyle.Short);

                    const firstActionRow = new ActionRowBuilder().addComponents(answer);

                    captchaModal.addComponents(firstActionRow);

                    const msg = await user.send({ embeds: [capEmbed, alertEmbed], files: [attachment], components: [captchaButton] }).catch(err => {
                        return console.log(err);
                    });

                    const collector = msg.createMessageComponentCollector({ time: serviceConfig.ExpireInMS });

                    collector.on("collect", async i => {
                        if (i.customId === "captchaButton") {
                            i.showModal(captchaModal);
                        }
                    });

                    collector.on("end", async collected => {
                        const latestConfig = await BotConfig.findOne({ GuildID: interaction.guild.id });
                        const latestServiceConfig = latestConfig?.services?.captcha;
                        let latestUserData = latestServiceConfig.users?.find(u => u.UserID === user.id);

                        if (latestUserData && latestUserData.CaptchaStatus === "Pending") {
                            latestUserData.CaptchaStatus = "Expired due to time limit";
                            latestUserData.CaptchaExpired = true;
                            await updateServiceConfig(latestConfig, "captcha", { users: latestServiceConfig.users });

                            await msg.delete().catch(err => console.log(err));
                            return await user.send({ content: "\`⚠️\` Your captcha has expired, please contact a server Admin in order to gain the verified role." });
                        }

                        await msg.delete().catch(err => console.log(err));
                    });

                    await interaction.followUp({ content: `✅ Successfully resent CAPTCHA verification to ${user}`, flags: MessageFlags.Ephemeral });
                } else {
                    return await interaction.reply({ content: `\`⚠️\` ${user}'s CAPTCHA is not expired!`, flags: MessageFlags.Ephemeral });
                }
                break;
            case "bypass":
                const bypassUser = options.getUser("user");
                guildMember = await interaction.guild.members.fetch(bypassUser);

                role = serviceConfig.RoleID;

                if (guildMember.roles.cache.has(role)) return await interaction.reply({ content: "\`❓\` This user already has verified role, if you want to revoke it and send him a new captcha challenge please run \`/captcha resend\` command.", flags: MessageFlags.Ephemeral });

                await guildMember.roles.add(role).catch(async err => {
                    console.log(err);
                    return await interaction.reply({ content: "\`🔴\` There was an error while attempting to add you the verified role, please contact server staff to solve!", flags: MessageFlags.Ephemeral });
                });

                let bypassUserData = serviceConfig.users?.find(u => u.UserID === guildMember.id);
                if (!bypassUserData) {
                    bypassUserData = {
                        UserID: guildMember.id,
                        Username: guildMember.user.username,
                        JoinedAt: await frmtDate(),
                        ReJoinedTimes: 0,
                        Captcha: null,
                        CaptchaStatus: "Submitted",
                        CaptchaExpired: null,
                        Bypassed: true,
                        BypassedBy: interaction.user.id
                    };
                    serviceConfig.users.push(bypassUserData);
                } else {
                    bypassUserData.Captcha = null;
                    bypassUserData.CaptchaStatus = "Submitted";
                    bypassUserData.CaptchaExpired = null;
                    bypassUserData.Bypassed = true;
                    bypassUserData.BypassedBy = interaction.user.id;
                }

                await updateServiceConfig(config, "captcha", { users: serviceConfig.users });

                await interaction.reply({ content: `\`🟢\` You bypassed ${guildMember} (${guildMember.id}) from captcha verification`, flags: MessageFlags.Ephemeral });
                break;
            case "check-system":
                embed = new EmbedBuilder()
                    .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                    .setColor("Blue")
                    .setTitle("Status Of CAPTCHA Verification System")
                    .setThumbnail(msgConfig.thumbnail)
                    .addFields({ name: "Status", value: serviceConfig.enabled ? "Enabled" : "Disabled", inline: true })
                    .addFields({ name: "Verified Role", value: `<@&${serviceConfig.RoleID}>`, inline: true })
                    .addFields({ name: "Rejoin Limit per User", value: `${serviceConfig.ReJoinLimit}`, inline: false })
                    .addFields({ name: "CAPTCHA Expire Time (in seconds)", value: `${await msToSecs(serviceConfig.ExpireInMS)}`, inline: true })
                    .addFields({ name: "CAPTCHA Solution", value: `||${serviceConfig.Captcha}||`, inline: false })
                    .setFooter({ text: "Captcha System by RikiCatte", iconURL: msgConfig.footer_iconURL })

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
            case "check-user":
                user = options.getUser("user");
                userData = serviceConfig.users?.find(u => u.UserID === user.id);
                if (!userData) return await interaction.reply({ content: `\`⚠️\` User **${user}** is not listed in DB`, flags: MessageFlags.Ephemeral });

                embed = new EmbedBuilder()
                    .setAuthor({ name: client.user.username, iconURL: msgConfig.author_img, url: msgConfig.author_link })
                    .setColor("Blue")
                    .setTitle(`CAPTCHA Verification Status of ${user.username}`)
                    .setThumbnail(msgConfig.thumbnail)
                    .addFields({ name: "User ID", value: `${user.id}`, inline: true })
                    .addFields({ name: "Joined At", value: `${userData.JoinedAt ?? "N/A"}`, inline: true })
                    .addFields({ name: "Rejoined Times", value: `${userData.ReJoinedTimes ?? "N/A"}`, inline: true })
                    .addFields({ name: "CAPTCHA Solution", value: `||${userData.Captcha ?? "N/A"}||`, inline: false })
                    .addFields({ name: "CAPTCHA Status", value: `${userData.CaptchaStatus ?? "N/A"}`, inline: true })
                    .addFields({ name: "Captcha Expired", value: `${userData.CaptchaExpired ?? "N/A"}`, inline: true })
                    .addFields({ name: "Missed CAPTCHAs", value: `${userData.MissedTimes ?? "N/A"}`, inline: false })
                    .addFields({ name: "Resent?", value: `${userData.Resent ?? "N/A"}`, inline: true })
                    .addFields({ name: "Resent By", value: `${userData.ResentBy ?? "N/A"}`, inline: true })
                    .addFields({ name: "Bypassed?", value: `${userData.Bypassed ?? "N/A"}`, inline: false })
                    .addFields({ name: "Bypassed By", value: `${userData.BypassedBy ?? "N/A"}`, inline: true })
                    .setFooter({ text: "Captcha System by RikiCatte", iconURL: msgConfig.footer_iconURL })

                await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                break;
        }
    }
}