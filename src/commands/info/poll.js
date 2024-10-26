const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("poll")
        .setDescription("Create a poll and send it to a certain channel")
        .addStringOption(option =>
            option.setName("description")
                .setDescription("Describe the poll.")
                .setRequired(true)
        )
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Where do you want to send the poll to?")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ).toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Connect],


    run: async (client, interaction) => {
        const { options, member } = interaction;

        const channel = options.getChannel("channel");
        const description = options.getString("description");

        const embed = new EmbedBuilder()
            .setColor("Gold")
            .setDescription(description)
            .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
            .setThumbnail(member.displayAvatarURL({ dynamic: true }))
            .setColor("Random")
            .setTimestamp()
            .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

        try {
            const m = await channel.send({ embeds: [embed] })
            await m.react("✅")
            await m.react("❌")
            await interaction.reply({ content: "Poll was succesfully sent to the channel.", ephemeral: true });
        } catch (err) {
            console.log(err);
        }
    }
}