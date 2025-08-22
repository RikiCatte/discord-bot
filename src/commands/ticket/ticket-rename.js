const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const BotConfig = require("../../schemas/BotConfig");
const replyNoConfigFound = require("../../utils/BotConfig/replyNoConfigFound");
const replyServiceAlreadyEnabledOrDisabled = require("../../utils/BotConfig/replyServiceAlreadyEnabledOrDisabled");
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
        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config?.services?.ticket;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "ticket");
        if (!serviceConfig.enabled) return await replyServiceAlreadyEnabledOrDisabled(interaction, "ticket", "disabled", false);

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
                return await message.reply({ content: '\`❌\` Missing arguments!', flags: MessageFlags.Ephemeral });
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