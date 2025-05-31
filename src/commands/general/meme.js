const { SlashCommandBuilder, MessageEmbed, EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("meme")
        .setDescription("Get a meme!")
        .addStringOption(option =>
            option.setName("platform")
                .setDescription("Meme platform (optional)")
                .addChoices(
                    { name: "Reddit", value: "reddit" },
                    { name: "Giphy", value: "giphy" }
                )
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],
    disabled: true,

    run: async (client, interaction) => {
        const { options } = interaction;

        const platform = options.getString("platform");

        const embed = new EmbedBuilder();

        async function redditMeme() {
            const res = await fetch('https://www.reddit.com/r/memes/random/.json');
            const meme = await res.json();

            if (!interaction.replied) {
                const title = meme[0].data.children[0].data.title;
                const url = meme[0].data.children[0].data.url;
                const author = meme[0].data.children[0].data.author;

                interaction.reply({
                    embeds: [
                        embed.setTitle(title)
                            .setImage(url)
                            .setURL(url)
                            .setColor("Random")
                            .setFooter({ text: author })
                    ]
                });
            } else {
                // Interaction has already been replied to, handle the timeout scenario
                interaction.followUp("Sorry, your meme request timed out. Please try again.");
            }
        };

        async function giphyMeme() {
            const res = await fetch('https://api.giphy.com/v1/gifs/random?api_key=QKdvMwi3Izr3qVbfFNR5mJIwATU7mxl8&tag=&rating=g');
            const meme = await res.json();

            if (!interaction.replied) {
                const title = meme.data.title;
                const url = meme.data.images.original.url;
                const link = meme.data.url;
                const author = meme.data.user.display_name;
                const pf = meme.data.user.avatar_url;

                interaction.reply({
                    embeds: [
                        embed.setTitle(`${title}`)
                            .setImage(`${url}`)
                            .setURL(link)
                            .setColor("Random")
                            .setFooter({ text: author, iconURL: pf })
                    ]
                });
            } else {
                // Interaction has already been replied to, handle the timeout scenario
                interaction.followUp("Sorry, your meme request timed out. Please try again.");
            }
        };

        if (platform === "reddit") {
            redditMeme();
        }

        if (platform === "giphy") {
            giphyMeme();
        }

        if (!platform) {
            const memes = [giphyMeme, redditMeme];
            memes[Math.floor(Math.random() * memes.length)]();
        }
    }
}