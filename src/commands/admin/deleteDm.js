const { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } = require("discord.js");

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
        await interaction.deferReply({ ephemeral: true });
        const { options } = interaction;

        const user = options.getUser("user");

        try {
            const dmChannel = await user.createDM();

            const messages = await dmChannel.messages.fetch({ limit: 100 });

            if (messages.size === 0) {
                return await interaction.reply({ content: "There are no messages to delete.", ephemeral: true });
            }

            for (const message of messages.values()) {
                await message.delete();
            }

            return await interaction.editReply({ content: `Successfully deleted all messages with ${user.username}!`, ephemeral: true });
        } catch (err) {
            console.error(err);
            return await interaction.editReply({ content: "There was an error trying to delete messages with this user.", ephemeral: true });
        }
    }
}