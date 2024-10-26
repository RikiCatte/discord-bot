const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const puppeteer = require("puppeteer");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("yt-sumarize")
        .setDescription("Summarize a yt video")
        .addStringOption(option =>
            option.setName("url")
                .setDescription("The video URL to summarize").setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const { options } = interaction;
        const url = options.getString("url");

        await interaction.reply({ content: "\`🧠\` Loading your response.. this could take some time", ephemeral: true });

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto("https://www.summarize.tech/");

        await page.waitForSelector('input.me-auto.form-control');
        await page.type('input.me-auto.form-control', url);

        await page.keyboard.press("Enter");

        await page.waitForSelector("section");

        let text = await page.evaluate(async () => {
            const paragraph = document.querySelectorAll("p")[1];
            return paragraph.innerText;
        });

        text = text.replace("Youtube video", `[Youtube video](${url})`);

        setTimeout(async () => {
            if (text.length == 0) return await interaction.editReply({ content: "There was an error getting that response, try again later!", ephemeral: true });
        }, 30000);

        await browser.close();

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setDescription(text);

        await interaction.editReply({ content: "✅ Here is the summary of your video", embeds: [embed], ephemeral: true });
    }
}