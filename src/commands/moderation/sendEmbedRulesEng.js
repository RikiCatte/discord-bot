const { SlashCommandBuilder, Colors, MessageFlags } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("send-embedrules-eng")
        .setDescription("Reply with server rules embed (english version)")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],


    run: async (client, interaction) => {
        const embed = {
            color: Colors.Blurple,
            title: "Server Rules",
            author: {
                name: `${client.user.username}`,
                icon_url: msgConfig.author_img
            },
            thumbnail: {
                url: msgConfig.thumbnail,
            },
            fields: [
                {
                    name: "🇬🇧",
                    value: "- Do not break Discord guidelines: https://www.discord.com/guidelines" +
                        "\n- Be respectful and kind to others." +
                        "\n- No spamming or self-promotion." +
                        "\n- Stay on topic in designated channels." +
                        "\n- No NSFW or explicit content." +
                        "\n- Use appropriate language." +
                        "\n- No personal attacks or doxxing." +
                        "\n- Follow server structure and guidelines." +
                        "\n- No unauthorized bots or automation." +
                        "\n- Respect privacy and confidentiality." +
                        "\n- Report issues to server admins." +
                        "\n\n *By staying on this server you agree to follow these rules.*"
                },
            ],
            footer: {
                text: msgConfig.footer_text,
                icon_url: msgConfig.footer_iconURL,
            },
        }

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply({ content: "Message has been sent below!", flags: MessageFlags.Ephemeral });
    }
}