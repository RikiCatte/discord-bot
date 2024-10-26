const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embedcreator')
        .setDescription('Create a custom embed')
        .addStringOption(option => option.setName('title').setDescription('Embed\'s title').setRequired(true))
        .addStringOption(option => option.setName('description').setDescription('Embed\'s description').setRequired(true))
        .addStringOption(option => option.setName('color').setDescription('Embed\'s color (6 digit HEX Code)').setRequired(true).setMaxLength(6))
        .addStringOption(option => option.setName('image').setDescription('Embed\'s image').setRequired(true))
        .addBooleanOption(option => option.setName('timestamp').setDescription('Does the Embed\'s timestamp have to be shown?').setRequired(true))
        .addStringOption(option => option.setName('thumbnail').setDescription('Embed\'s thumbnail').setRequired(false))
        .addStringOption(option => option.setName('field-name1').setDescription('Embed\'s field name1').setRequired(false))
        .addStringOption(option => option.setName('field-value1').setDescription('Embed\'s field value1').setRequired(false))
        .addStringOption(option => option.setName('field-name2').setDescription('Embed\'s field name2').setRequired(false))
        .addStringOption(option => option.setName('field-value2').setDescription('Embed\'s field value2').setRequired(false))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {

        const { options } = interaction;

        const title = options.getString('title');
        const description = options.getString('description');
        const color = options.getString('color');
        const image = options.getString('image');
        const thumbnail = options.getString('thumbnail');
        const fieldn1 = options.getString('field-name1') || " ";
        const fieldv1 = options.getString('field-value1') || " ";
        const fieldn2 = options.getString('field-name2') || " ";
        const fieldv2 = options.getString('field-value2') || " ";
        const timestamp = options.getBoolean('timestamp');

        if (image) {
            if (!image.startsWith('http')) return await interaction.reply({ content: "You cannot make this as your image", ephemeral: true })
        }

        if (thumbnail) {
            if (!thumbnail.startsWith('http')) return await interaction.reply({ content: "You cannot make this as your thumbnail", ephemeral: true })
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setImage(image)
            .setThumbnail(thumbnail)
            .addFields({ name: `${fieldn1}`, value: `${fieldv1}` })
            .addFields({ name: `${fieldn2}`, value: `${fieldv2}` })
            //.setFooter({ text: `${footer}`, iconURL: interaction.member.displayAvatarURL({ dynamic: true }) })
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });
        if (timestamp) {
            embed.setTimestamp()
        }

        await interaction.reply({ content: "Your embed has been sent below", ephemeral: true });

        await interaction.channel.send({ embeds: [embed] });
    }
}