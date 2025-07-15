const { EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
    customId: "fetchErrorUserInfo",
    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        let member = interaction.member;

        const userEmbed = new EmbedBuilder()
            .setColor("Blurple")
            .setDescription("This user has triggered a slash command error while using one of the commands listed above.")
            .addFields({ name: "Error User", value: `${member} (${member.id})` })
            .setTimestamp();

        await interaction.reply({ embeds: [userEmbed], Flags: MessageFlags.Ephemeral });
    },
};