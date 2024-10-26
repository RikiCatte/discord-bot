const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("suggest")
        .setDescription("Suggest something.")
        .addStringOption(option =>
            option.setName("name")
                .setDescription("Name your suggestion")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("description")
                .setDescription("Describe your suggestion.")
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        const { guild, options, member } = interaction;

        const name = options.getString("name");
        const description = options.getString("description");

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setDescription(`A suggestion made by ${member}`)
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(member.displayAvatarURL({ dynamic: true }))
            .setColor("Random")
            .addFields(
                { name: "Suggestion", value: `${name}` },
                { name: "Description", value: `${description}` },
            )
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
            .setTimestamp();

        await guild.channels.cache.get(msgConfig.suggestChannel).send({ // suggestion's channel id
            embeds: ([embed]),
        }).then((s) => {
            s.react('✅')
            s.react('❌')
        }).catch((err) => {
            throw err;
        });

        interaction.reply({ content: "\`✅\` Your suggestion has been succesfully sent.", ephemeral: true });
    }
}