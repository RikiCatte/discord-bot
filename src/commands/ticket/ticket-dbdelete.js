const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js')
const ticketSchema = require('../../schemas/ticket');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-dbdelete')
        .setDescription('Delete all tickets from db')
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        try {
            let result = await ticketSchema.deleteMany({});
            await interaction.editReply({ content: `\`✅\` Succesfully deleted ${result.deletedCount} tickets from DB`, ephemeral: true });
        } catch (e) {
            console.log(e);
            await interaction.editReply({ content: `\`❌\` Something went wrong! -> ${e}`, ephemeral: true });
        }
    },
}