const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { default: axios } = require('axios');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enlarge')
        .setDescription('Make emoji bigger')
        .addStringOption(option => option.setName('emoji').setDescription('The emoji you would like to enlarge').setRequired(true))
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        let emoji = interaction.options.getString('emoji')?.trim();

        if (emoji.startsWith("<") && emoji.endsWith(">")) {
            const id = emoji.match(/\d{15,}/g)[0];

            const type = await axios.get(`https://cdn.discordapp.com/emojis/${id}.gif`)
                .then(image => {
                    if (image) return "gif"
                    else return "png"
                }).catch(err => {
                    return "png"
                })

            emoji = `https://cdn.discordapp.com/emojis/${id}.${type}?quality=lossless`
        }

        if (!emoji.startsWith("http") || !emoji.startsWith("https")) {
            return await interaction.reply({ content: "You can't enlarge default emojis!", flags: MessageFlags.Ephemeral });
        }

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setDescription(':white_check_mark: **Your emoji has been enlarged**')
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(msgConfig.thumbnail)
            .setImage(emoji)
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        await interaction.reply({ embeds: [embed] });
    }
}