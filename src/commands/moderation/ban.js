const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const BotConfig = require("../../schemas/BotConfig");
const msgConfig = require("../../messageConfig.json");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");
const replyServiceNotEnabled = require('../../utils/BotConfig/replyServiceNotEnabled');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a user from this discord server or check bans")
        .addSubcommand(sub =>
            sub.setName("user")
                .setDescription("Ban a user from this discord server")
                .addUserOption(option =>
                    option.setName("target")
                        .setDescription("User to ban.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("Reason for the ban.")
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName("check")
                .setDescription("View all bans.")
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],

    run: async (client, interaction) => {
        const { options, guild, member } = interaction;
        const subcommand = options.getSubcommand();

        if (subcommand === "user") {
            const user = options.getUser("target");
            const reason = options.getString("reason") || "No reason provided";

            const errEmbed = new EmbedBuilder()
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setColor(0xc72c3b)
                .setTimestamp()
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            let targetMember;
            try {
                targetMember = await guild.members.fetch(user.id);
            } catch (e) {
                errEmbed.setDescription(`\`❌\` User ${user.username} is not in this server.`);
                return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
            }

            if (user.id === member.id) {
                errEmbed.setDescription(`\`❌\` You can't ban yourself.`);
                return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
            }

            if (user.id === client.user.id) {
                errEmbed.setDescription(`\`❌\` You can't ban the bot.`);
                return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
            }

            if (targetMember.roles.highest.position >= member.roles.highest.position) {
                errEmbed
                    .setDescription(`\`❌\` You can't take action on ${user.username} since they have a higher or equal role than yours`)
                    .setThumbnail(targetMember.displayAvatarURL({ dynamic: true }));
                return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
            }

            if (!targetMember.bannable) {
                errEmbed.setDescription(`\`❌\` I can't ban this user. Make sure my role is above theirs and I have the right permissions.`);
                return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
            }

            try {
                const config = await BotConfig.findOne({ GuildID: guild.id });
                const serviceConfig = config?.services?.ban;

                if (!serviceConfig) return await replyNoConfigFound(interaction, "ban");
                if (!serviceConfig.enabled) return await replyServiceNotEnabled(interaction, "ban");

                await targetMember.ban({ reason: reason });

                const embed = new EmbedBuilder()
                    .setDescription(`\`⚖️\` Successfully banned ${user} with reason: ${reason}`)
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                    .setColor(0x5fb041)
                    .setTimestamp()
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } catch (error) {
                errEmbed.setDescription(`\`❌\` An error occurred while trying to ban ${targetMember} user.`);
                return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
            }
        }

        if (subcommand === "check") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // Get bans from DB
            const config = await BotConfig.findOne({ GuildID: guild.id });
            const dbBans = config?.services?.ban?.Bans || [];

            // Get bans from Discord guild
            let discordBans = [];
            try {
                const fetched = await guild.bans.fetch();
                discordBans = Array.from(fetched.values());
            } catch (e) {
                // If you don't have permissions, only show those from the DB
            }

            // Create a map to avoid duplicates
            const dbBanIDs = dbBans.map(b => b.UserID);
            const onlyDiscordBans = discordBans.filter(b => !dbBanIDs.includes(b.user.id));

            let description = "";

            if (dbBans.length) {
                description += "**Bans in database:**\n";
                description += dbBans.map(b =>
                    `• <@${b.UserID}> | By: <@${b.BannedBy}> | Reason: ${b.Reason || "No reason"} | At: <t:${Math.floor(new Date(b.BannedAt).getTime() / 1000)}:f>`
                ).join("\n");
            } else {
                description += "No bans found in the database.\n";
            }

            if (onlyDiscordBans.length) {
                description += "\n\n**Bans present only on Discord:**\n";
                description += onlyDiscordBans.map(b =>
                    `• <@${b.user.id}> | Tag: ${b.user.tag} | Reason: ${b.reason || "No reason"}`
                ).join("\n");
            }

            if (!dbBans.length && !onlyDiscordBans.length) {
                description = "No bans found in the database or on Discord.";
            }

            const bansEmbed = new EmbedBuilder()
                .setTitle("Banned Users")
                .setColor(0xc72c3b)
                .setDescription(description);

            return interaction.editReply({ embeds: [bansEmbed] });
        }
    }
}