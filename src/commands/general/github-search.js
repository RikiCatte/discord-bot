const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const puppeteer = require("puppeteer");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("github-search")
        .setDescription("Search for GitHub repositories")
        .addStringOption(option =>
            option.setName("query")
                .setDescription("The repo to search for")
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    disabled: true, // Not supports arm64

    run: async (client, interaction) => {
        const { options } = interaction;
        const query = options.getString("query");
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        var url = `https://github.com/search?q=${query}&type=reporsitories`;
        await page.goto(url);

        const data = await page.evaluate(() => {
            const results = [];
            const dataElements = document.querySelectorAll('[data-testid="results-list"] > .Box-sc-g0xbh4-0.bItZsX');
        
            dataElements.forEach(dataElement => {
                const titleElement = dataElement.querySelector('.Box-sc-g0xbh4-0.lhFvfi .search-title a');
                const languageElement = dataElement.querySelector('.Box-sc-g0xbh4-0.eaToeg .gPDEWA');
        
                if (titleElement) {
                    const dataObj = {
                        title: titleElement.textContent.trim(),
                        link: titleElement.href,
                        language: languageElement ? languageElement.textContent.trim() : "N/A"
                    };
                    results.push(dataObj);
                }
            });
        
            return results;
        });        

        await browser.close();

        console.log(data);
        if (data.length <= 0) return await interaction.editReply({ content: `\`⚠️\` Nothing found matching query \`${query}\`! Please note that this may occur due to a rate limit... if this is the case, try again in a few seconds` });

        const format = data.map(item => `[${item.title}](${item.link}); Language: ${item.language}`);

        var fixedUrl = url.replace(/ /g, "%");
        const button = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel("View All")
                    .setStyle(ButtonStyle.Link)
                    .setURL(fixedUrl)
            );

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle(`Github Search Results Matching \`${query}\``)
            .setDescription(format.join(""));

        await interaction.editReply({ embeds: [embed], components: [button] });
    }
}