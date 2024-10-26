const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ms = require("ms");
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Mute a member from the server.")
        .addUserOption(option =>
            option.setName("target")
                .setDescription("Select the user you want to mute.")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("time")
                .setDescription("How long should the mute last? (Ex. 1m / 1h / 1d)")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("What is the reason of the mute?")
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ModerateMembers],
    botPermissions: [PermissionFlagsBits.ModerateMembers],

    run: async (client, interaction) => {
        const { guild, options } = interaction;

        const user = options.getUser("target");
        const member = guild.members.cache.get(user.id);
        const time = options.getString("time");
        const convertedTime = ms(time);
        const reason = options.getString("reason") || "No reason provided";

        const errEmbed = new EmbedBuilder()
            .setDescription("Something went wrong. Please try again later.")
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(msgConfig.thumbnail)
            .setColor(0xc72c3b)
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        const successEmbed = new EmbedBuilder()
            .setTitle("**\`✅\` Muted**")
            .setDescription(`Succesfully muted ${user}.`)
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: "Reason", value: `${reason}`, inline: true },
                { name: "Duration", value: `${time}`, inline: true }
            )
            .setColor(0x5fb041)
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        if (member.roles.highest.position >= interaction.member.roles.highest.position) // commentare in caso di errori
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });


        if (!convertedTime)
            return interaction.reply({ embeds: [errEmbed], ephemeral: true });

        try {
            await member.timeout(convertedTime, reason);

            interaction.reply({ embeds: [successEmbed], ephemeral: true });
        } catch (err) {
            console.log(err);
            return interaction.reply({ content: "You have to select a valid target!", ephemeral: true });
        }
    }
}