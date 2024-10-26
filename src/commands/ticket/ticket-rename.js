const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-rename')
        .setDescription('Rename a Ticket')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name that you want to put')
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages],

    run: async (client, interaction) => {
        try {
            const { options, message, member } = interaction;
            const oldName = interaction.channel.name;
            const newName = options.getString('name')

            const successEmbed = new EmbedBuilder()
                .setTitle('\`✅\` Ticket succesfully renamed!')
                .setDescription(`Ticket renamed from \`${oldName}\` to \`${newName}\``)
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setColor("Green")
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .setTimestamp()
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

            if (!newName)
                return await message.reply({ content: '\`❌\` Missing arguments!', ephemeral: true });
            else {
                await interaction.channel.setName(newName);
                return await interaction.reply({ embeds: [successEmbed] });
            }
        } catch (e) {
            console.log(e);
            return await interaction.reply({ content: `\`❌\` Something went wrong: ${e}` });
        }
    }
}