const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const banSchema = require("../../schemas/ban");
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a user from discord server. (not multi-guilded)")
        .addUserOption(option =>
            option.setName("target")
                .setDescription("User to ban.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for the ban.")
        ).toJSON(),
    userPermissions: [PermissionFlagsBits.BanMembers],
    botPermissions: [PermissionFlagsBits.BanMembers],

    run: async (client, interaction) => {
        const { options, guild, member } = interaction;

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
            errEmbed.setDescription(`\`❌\` The user is not in this server.`);
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
                .setDescription(`You can't take action on ${user.username} since they have a higher or equal role than yours`)
                .setThumbnail(targetMember.displayAvatarURL({ dynamic: true }));
            return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
        }

        if (!targetMember.bannable) {
            errEmbed.setDescription(`\`❌\` I can't ban this user. Make sure my role is above theirs and I have the right permissions.`);
            return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
        }

        try {
            await targetMember.ban({ reason: reason });

            await banSchema.create({
                Guild: guild.id,
                UserID: user.id,
                Reason: reason,
                BannedAt: new Date()
            });

            const embed = new EmbedBuilder()
                .setDescription(`\`✅\` Successfully banned ${user} with reason: ${reason}`)
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setColor(0x5fb041)
                .setTimestamp()
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            errEmbed.setDescription(`\`❌\` An error occurred while trying to ban this user.`);
            return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });
        }
    }
}