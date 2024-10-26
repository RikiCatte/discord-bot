const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { default: axios } = require('axios')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emoji-steal')
        .setDescription('Adds a given emoji to the server')
        .addStringOption(option => option.setName('emoji').setDescription('The emoji you want to add to the server').setRequired(true))
        .addStringOption(option => option.setName('name').setDescription('The emoji name').setRequired(true))
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) return await interaction.reply({ content: "You can't handle this.", ephemeral: true });

        let emoji = interaction.options.getString('emoji')?.trim();
        const name = interaction.options.getString('name');

        if (emoji.startsWith("<") && emoji.endsWith(">")) {
            const id = emoji.match(/\d{15,}/g)[0];

            const type = await axios.get(`https://cdn.discordapp.com/emojis/${id}.gif`)
                .then(image => {
                    if (image) return "gif";
                    else return "png";
                }).catch(err => {
                    console.log(err);
                    return "png";
                })

            emoji = `https://cdn.discordapp.com/emojis/${id}.${type}?quality=lossless`
        }

        if (!emoji.startsWith("http")) {
            return await interaction.reply({ content: "You can't steal default emojis" })
        }

        if (!emoji.startsWith("https")) {
            return await interaction.reply({ content: "You can't steal default emojis" })
        }

        interaction.guild.emojis.create({ attachment: `${emoji}`, name: `${name}` })
            .then(emoji => {
                const embed = new EmbedBuilder()
                    .setColor("Blue")
                    .setDescription(`Added ${emoji}, with name "**${name}**"`)
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(msgConfig.thumbnail)
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                    .setTimestamp()

                return interaction.reply({ embeds: [embed] });
            }).catch(err => {
                console.log(err);
                interaction.reply({ content: "You can't add other emojis because you reached the server's emoji limit", ephemeral: true })
            })
    }
}