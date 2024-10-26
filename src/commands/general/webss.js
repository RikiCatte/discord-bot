const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const puppeteer = require('puppeteer');
const msgConfig = require("../../messageConfig.json");
module.exports = {
    data: new SlashCommandBuilder()
        .setName('webss')
        .setDescription('Took a screnshot of a website')
        .addStringOption(option => option.setName('website').setDescription('Design the website that you want to take a screenshot.'))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        const { options } = interaction;
        const website = options.getString('website');

        try {
            const browser = await puppeteer.launch();
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
            await interaction.editReply({ content: `⚠️ | An error has occurred while taking the screenshot, try putting a valid website!` });
        }
    }
}