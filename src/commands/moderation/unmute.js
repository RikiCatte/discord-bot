const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Unmute a member from the server")
        .addUserOption(option =>
            option.setName("target")
                .setDescription("Select the user you want to unmute.")
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ModerateMembers],
    botPermissions: [PermissionFlagsBits.ModerateMembers],

    run: async (client, interaction) => {
        const { guild, options } = interaction;

        const user = options.getUser("target");
        const member = guild.members.cache.get(user.id);

        const errEmbed = new EmbedBuilder()
            .setDescription("Something went wrong. Please try again later.")
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(msgConfig.thumbnail)
            .setColor(0xc72c3b)
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        const successEmbed = new EmbedBuilder()
            .setTitle("**\`✅\` Unmuted**")
            .setDescription(`Succesfully unmuted ${user}.`)
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setColor(0x5fb041)
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        if (member.roles.highest.position >= interaction.member.roles.highest.position) // commentare in caso di errori
            return interaction.reply({ embeds: [errEmbed], flags: MessageFlags.Ephemeral });

        try {
            await member.timeout(null);

            interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
        } catch (err) {
            console.log(err);
            return interaction.reply({ content: "You have to select a valid target!", flags: MessageFlags.Ephemeral });
        }
    }
}