const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require("discord.js");
const BotConfig = require("../../schemas/BotConfig");
const msgConfig = require("../../messageConfig.json");
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceNotEnabled = require("../../utils/BotConfig/replyServiceNotEnabled");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Revoke a server ban.")
        .addSubcommand(sub =>
            sub.setName("user")
                .setDescription("Revoke a ban made to someone in this server")
                .addStringOption(option =>
                    option.setName("userid")
                        .setDescription("ID of the user to unban.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("Reason for the unban.")
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName("check")
                .setDescription("View all unbans.")
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],

    run: async (client, interaction) => {
        const { options, guild, member } = interaction;
        const subcommand = options.getSubcommand();

        if (subcommand === "user") {
            const userId = options.getString("userid");
            const reason = options.getString("reason") || "No reason provided";

            const errEmbed = new EmbedBuilder()
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setColor(0xc72c3b)
                .setTimestamp()
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!/^\d{17,19}$/.test(userId)) {
                errEmbed.setDescription(`\`❌\` Invalid user ID.`);
                return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
            }

            try {
                const banInfo = await guild.bans.fetch(userId).catch(() => null);
                if (!banInfo) {
                    errEmbed.setDescription(`\`❌\` This user is not banned or the ID is invalid.`);
                    return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
                }

                const config = await BotConfig.findOne({ GuildID: guild.id });
                const serviceConfig = config?.services?.unban;

                if (!serviceConfig) return await replyNoConfigFound(interaction, "unban");
                if (!serviceConfig.enabled) return await replyServiceNotEnabled(interaction, "unban");

                if (config?.services?.ban?.Bans) {
                    config.services.ban.Bans = config.services.ban.Bans.filter(b => b.UserID !== userId);
                    await updateServiceConfig(config, "ban", { Bans: config.services.ban.Bans });
                }

                await guild.members.unban(userId, reason);

                serviceConfig.Unbans = serviceConfig.Unbans || [];
                serviceConfig.Unbans.push({
                    UserID: userId,
                    UnbannedBy: member.id,
                    Reason: reason,
                    UnbannedAt: new Date()
                });
                await updateServiceConfig(config, "unban", { Unbans: serviceConfig.Unbans });

                const embed = new EmbedBuilder()
                    .setDescription(`\`⚖️\` Successfully unbanned <@${userId}> with reason: ${reason}`)
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(banInfo.user.displayAvatarURL({ dynamic: true }))
                    .setColor(0x5fb041)
                    .setTimestamp()
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            } catch (error) {
                errEmbed.setDescription(`\`❌\` An error occurred while trying to unban user ID ${userId}.`);
                return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
            }
        }

        if (subcommand === "check") {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const config = await BotConfig.findOne({ GuildID: guild.id });
            const dbUnbans = config?.services?.unban?.Unbans || [];

            let description = "";

            if (dbUnbans.length) {
                description += "**Unbans in database:**\n";
                description += dbUnbans.map(u =>
                    `• <@${u.UserID}> | By: <@${u.UnbannedBy}> | Reason: ${u.Reason || "No reason"} | At: <t:${Math.floor(new Date(u.UnbannedAt).getTime() / 1000)}:f>`
                ).join("\n");
            } else description += "No unbans found in the database.\n";

            const unbansEmbed = new EmbedBuilder()
                .setTitle("Unbanned Users")
                .setColor(0xc72c3b)
                .setDescription(description);

            return interaction.editReply({ embeds: [unbansEmbed] });
        }
    },
};