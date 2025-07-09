const { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deletedm")
        .setDescription("Delete all bot DMs with a user by user ID (even if not in the server)")
        .addStringOption((option) =>
            option
                .setName("userid")
                .setDescription("Enter the user ID!")
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

        const userId = options.getString("userid");

        try {
            const user = await client.users.fetch(userId);
            if (!user) {
                return await interaction.editReply({ content: "\`⚠️\` User not found.", flags: MessageFlags.Ephemeral });
            }

            let dmChannel;
            try {
                dmChannel = await user.createDM();
                await dmChannel.messages.fetch({ limit: 1 });
            } catch (dmErr) {
                return await interaction.editReply({ content: "\`ℹ️\` There is no open DM between the bot and this user, so there are no messages to delete.", flags: MessageFlags.Ephemeral });
            }

            const messages = await dmChannel.messages.fetch({ limit: 100 });
            const botMessages = messages.filter(msg => msg.author.id === client.user.id);

            if (botMessages.size === 0) {
                return await interaction.editReply({ content: `\`ℹ️\` There are no bot messages to delete in ${user.username} DMs.`, flags: MessageFlags.Ephemeral });
            }

            for (const message of botMessages.values()) {
                await message.delete();
            }

            return await interaction.editReply({ content: `\`✅\` Deleted all bot messages in DMs with ${user.username}!`, flags: MessageFlags.Ephemeral });
        } catch (err) {
            console.error(err);
            return await interaction.editReply({ content: "\`🔴\` An error occurred while deleting bot messages. Make sure the user ID is correct and the bot shares a DM with this user.", flags: MessageFlags.Ephemeral });
        }
    }
}