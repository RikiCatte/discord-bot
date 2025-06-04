const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const puppeteer = require('puppeteer');
require('dotenv').config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('webss')
        .setDescription('Took a screnshot of a website')
        .addStringOption(option => option.setName('website').setDescription('Design the website that you want to take a screenshot.').setRequired(true))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    disabled: true,

    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const { options } = interaction;
        const website = options.getString('website');

        try {
            const launchOptions = {
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            };
            if (process.env.CHROMIUM_PATH) {
                launchOptions.executablePath = process.env.CHROMIUM_PATH;
            }

            const browser = await puppeteer.launch(launchOptions);
            const page = await browser.newPage();
            await page.goto(website);
            await page.setViewport({ width: 1920, height: 1000 });

            const screenshot = await page.screenshot();
            await browser.close();

            const buffer = Buffer.from(screenshot, 'base64')
            const attachment = new AttachmentBuilder(buffer, { name: 'image.png' });

            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setImage('attachment://image.png')

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (e) {
            console.log(e);
            await interaction.editReply({ content: `⚠️ | An error has occurred while taking the screenshot, please input a valid website!` });
        }
    }
}