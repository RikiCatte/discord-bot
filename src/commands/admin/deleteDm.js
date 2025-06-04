const { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deletedm")
        .setDescription("Delete a cached DM channel within the bot and a user")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Select a user!")
                .setRequired(true)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [],

    /**
     * 
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction 
     * @returns 
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { options } = interaction;

        const user = options.getUser("user");

        try {
            const dmChannel = await user.createDM();

            const messages = await dmChannel.messages.fetch({ limit: 100 });
            
            // Filter messages to only include those sent by the bot
            const botMessages = messages.filter(msg => msg.author.id === client.user.id);

            if (botMessages.size === 0) {
                return await interaction.editReply({ content: "There are no bot messages to delete.", flags: MessageFlags.Ephemeral });
            }

            for (const message of botMessages.values()) {
                await message.delete();
            }

            return await interaction.editReply({ content: `Deleted all bot messages in DMs with ${user.username}!`, flags: MessageFlags.Ephemeral });
        } catch (err) {
            console.error(err);
            return await interaction.editReply({ content: "An error occurred while deleting bot messages.", flags: MessageFlags.Ephemeral });
        }
    }
}