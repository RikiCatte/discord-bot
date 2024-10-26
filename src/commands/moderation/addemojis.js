const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addemoji')
        .setDescription('Adds an emoji to the server')
        .addAttachmentOption(option => option.setName('emoji').setDescription('The emoji you want to add to the server').setRequired(true))
        .addStringOption(option => option.setName('name').setDescription('The name of the emoji').setRequired(true))
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ManageEmojisAndStickers],
    botPermissions: [PermissionFlagsBits.ManageEmojisAndStickers],


    run: async (client, interaction) => {
        const upload = interaction.options.getAttachment('emoji');
        const name = interaction.options.getString('name');

        await interaction.reply({ content: '⏲️ | Loading your emoji...' });

        const emoji = await interaction.guild.emojis.create({ attachment: `${upload.attachment}`, name: `${name}` }).catch(err => {
            setTimeout(() => {
                console.log(err);
                return interaction.editReply({ content: `${err.rawError.message}` });
            }, 2000)
        })

        setTimeout(() => {
            if (!emoji) return;

            const embed = new EmbedBuilder()
                .setColor("Blue")
                .setDescription(`Your emoji has been added ${emoji}`)
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setThumbnail(msgConfig.thumbnail)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })

            interaction.editReply({ content: '', embeds: [embed] });
        }, 3000)
    }
}