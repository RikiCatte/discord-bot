const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const kickSchema = require("../../schemas/kick");
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a user from the discord server.(not multi-guilded)")
        .addUserOption(option =>
            option.setName("target")
                .setDescription("User to be kicked.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for the kick.")
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],

    run: async (client, interaction) => {
        const { options } = interaction;

        const user = options.getUser("target");
        const reason = options.getString("reason") || "No reason provided";

        const member = await interaction.guild.members.fetch(user.id);

        const errEmbed = new EmbedBuilder()
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(msgConfig.thumbnail)
            .setDescription(`You can't take action on ${user.username} bacause he has a higher role than yours.`)
            .setColor(0xc72c3b)
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        if (member.roles.highest.position >= interaction.member.roles.highest.position)
            return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });

        await member.kick(reason);

        await kickSchema.create({ UserID: member, Reason: reason, KickedBy: interaction.user.id, KickedAt: new Date() });

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(member.displayAvatarURL({ dynamic: true }))
            .setDescription(`Succesfully kicked ${user} with reason: ${reason}`)
            .setColor("Green")
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        await interaction.reply({
            embeds: [embed],
        });
    }
}