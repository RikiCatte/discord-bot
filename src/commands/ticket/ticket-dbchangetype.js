const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const ticketSchema = require("../../schemas/ticket");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ticket-dbchangetype")
        .setDescription("Changes the ticket type in db schema")
        .addStringOption(option =>
            option.setName("type")
                .setDescription("Choose the new ticket type.")
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });
        const { guild, options } = interaction;
        const newType = options.getString('type');

        try {
            var data = await ticketSchema.findOneAndUpdate({ GuildID: guild.id, ChannelID: interaction.channel.id }, { Type: newType });

            if (!data) {
                return await interaction.editReply({ content: `\`❌\` Something went wrong while updating ticket type to **${newType}**` });
            }
            
            return await interaction.editReply({ content: `\`✅\` Succesfully updated ticket type DB variable to **${newType}**` });
        } catch (e) {
            console.log(e);
            await interaction.editReply({ content: `\`❌\` Something went wrong! -> ${e}`, ephemeral: true });
        }
    }
}