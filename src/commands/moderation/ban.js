const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
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
        const { options } = interaction;

        const user = options.getUser("target");
        const reason = options.getString("reason") || "No reason provided";

        const member = await interaction.guild.members.fetch(user.id);

        const errEmbed = new EmbedBuilder()
            .setDescription(`You can't take action on ${user.username} since he has a higher role than yours`)
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(member.displayAvatarURL({ dynamic: true }))
            .setColor(0xc72c3b)
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        if (member.roles.highest.position >= interaction.member.roles.highest.position)
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });

        await member.ban({ reason: reason });

        await banSchema.create({ Guild: interaction.guild.id, UserID: member, Reason: reason, BannedAt: new Date() });

        const embed = new EmbedBuilder()
            .setDescription(`Succesfully banned ${user} with reason: ${reason}`)
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setColor(0x5fb041)
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        await interaction.reply({
            embeds: [embed]
        });
    }
}