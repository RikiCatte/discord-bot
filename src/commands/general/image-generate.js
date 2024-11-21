const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image-generate')
        .setDescription('Generate an image with a certain AI Image Generative Model.')
        .addStringOption((option) =>
            option
                .setName('prompt')
                .setDescription('The text to generate the image from.')
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName('model')
                .setDescription('The model to use for image generation.')
                .setRequired(true)
                .addChoices(
                    { name: 'Stable Diffusion XL Base 1.0', value: 'stabilityai/stable-diffusion-xl-base-1.0' },
                    { name: 'Stable Diffusion v1.5', value: 'runwayml/stable-diffusion-v1-5' },
                    { name: 'Stable Diffusion v2.1', value: 'stabilityai/stable-diffusion-2-1' } // Other free models can be added
                )
        )
        .toJSON(),
    botPermissions: [],
    userPermissions: [],

    /**
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const apiKey = process.env.huggingFaceApi;

        await interaction.deferReply();

        const { options } = interaction;
        const prompt = options.getString('prompt');
        const model = options.getString('model');
        const refiner = options.getString('refiner');

        const host = `https://api-inference.huggingface.co/models/${model}`;

        try {
            const response = await axios.post(host, { inputs: prompt },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    responseType: 'arraybuffer',
                }
            );

            let buffer = Buffer.from(response.data, 'binary');

            const embed = new EmbedBuilder()
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img, url: msgConfig.author_url })
                .setTitle('\`🧠\` Image Generated Succesfully')
                .setImage('attachment://image.png')
                .setColor("Green")
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                .setTimestamp();

            embed.addFields({ name: "Model Used", value: model, inline: true });
            if (prompt.length > 1024) {
                embed.addFields({ name: "Prompt Used", value: "The prompt is too long to be displayed.", inline: false });
            } else {
                embed.addFields({ name: "Prompt Used", value: prompt, inline: false });
            }

            await interaction.editReply({ embeds: [embed], files: [{ attachment: buffer, name: 'image.png' }] });

        } catch (error) {
            console.log("[IMAGE-GENERATE]", error);
            return await interaction.editReply("An error occurred while generating the image. Try using a different model or try again later.");
        }
    }
}