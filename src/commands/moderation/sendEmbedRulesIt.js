const { SlashCommandBuilder, Colors, MessageFlags } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("send-embedrules-it")
        .setDescription("Reply with server rules embed (italian version)")
        .toJSON(),
    userPermissions: [],
    botPermissions: [],


    run: async (client, interaction) => {
        const embed = {
            color: Colors.Blurple,
            title: "Regolamento Server",
            author: {
                name: `${client.user.username}`,
                icon_url: msgConfig.author_img
            },
            thumbnail: {
                url: msgConfig.thumbnail,
            },
            fields: [
                {
                    name: "🇮🇹",
                    value: "- Non infrangere i ToS di Discord: https://www.discord.com/guidelines" +
                        "\n- Sii rispettoso e gentile verso gli altri utenti." +
                        "\n- Non spammare o fare pubblicità." +
                        "\n- Non andare fuori tema negli specifici canali." +
                        "\n- No NSFW o contenuto esplicito." +
                        "\n- Utilizza un linguaggio appropriato." +
                        "\n- Non effettuare qualsiasi tipo di attacco informatico verso gli utenti." +
                        "\n- Segui la struttura del Server e le sue linee guida." +
                        "\n- Niente BOT o automatismi non autorizzati." +
                        "\n- Rispetta la privacy degli altri utenti." +
                        "\n- Riporta problemi allo staff." +
                        "\n\n *Stando su questo server accetti automaticamente di seguire queste regole.*"
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