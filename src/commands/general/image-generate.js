const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const superagent = require('superagent');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image-generate')
        .setDescription('Generate an image using AI')
        .addStringOption(option =>
            option.setName('prompt')
                .setDescription('The prompt for generating your image')
                .setRequired(true),
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    async run(client, interaction) {
        await interaction.reply({ content: '<a:loading:1134632574107521115>  Loading your image! It may takes a long time... 😴', ephemeral: true });

        const { options } = interaction;
        const prompt = options.getString('prompt');

        let image = await superagent.post('https://backend.craiyon.com/generate')
            .send({
                prompt: `${prompt}`
            });

        const buffer = Buffer.from(image.body.images[0], 'base64');
        const attachment = new AttachmentBuilder(buffer, { name: 'image.png' });

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setImage('attachment://image.png')
            .setTitle(`Image based on: \`${prompt}\``)
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(msgConfig.thumbnail)
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        await interaction.editReply({ content: '', embeds: [embed], files: [attachment] });
    }
}