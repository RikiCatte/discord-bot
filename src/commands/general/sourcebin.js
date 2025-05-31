const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sourcebin-create')
        .setDescription('Create a sourcebin')
        .addStringOption(option =>
            option.setName('content')
                .setDescription('The content to put into the sourcebin')
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const { options } = interaction;
        const content = options.getString('content');

        const bin = await fetch('https://sourceb.in/api/bins', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                files: [
                    {
                        name: 'sourcebin.txt',
                        content: content,
                    },
                ],
            }),
        });

        if (bin.ok) {
            const { key } = await bin.json();
            const link = `https://sourceb.in/${key}`;

            const embed = new EmbedBuilder()
                .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                .setTitle(`:white_check_mark: I've created your **sourcebin**`)
                .setColor("Blurple")
                .setThumbnail(msgConfig.thumbnail)
                .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                .setTimestamp();

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Open')
                        .setURL(link)
                        .setStyle(ButtonStyle.Link)
                );

            await interaction.editReply({ embeds: [embed], components: [button] });
        } else {
            return await interaction.editReply({ content: 'There was an error while creating your sourcebin... please contact devs' });
        }
    }
}