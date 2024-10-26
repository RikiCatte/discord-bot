const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const tempmailSchema = require('../../schemas/tempmail');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tempmail-dbdelete')
        .setDescription('Delete all email messages from db')
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        try {
            let result = await tempmailSchema.deleteMany({});
            await interaction.editReply({ content: `\`✅\` Succesfully deleted ${result.deletedCount} tempmail messages from DB`, ephemeral: true });
        } catch (e) {
            console.log(e);
            await interaction.editReply({ content: `\`❌\` Something went wrong while deleting emails from DB! -> ${e}`, ephemeral: true });
        }
    },
}