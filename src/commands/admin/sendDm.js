const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("senddm")
        .setDescription("Write a message to someone!")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Select a user!")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("message")
                .setDescription("The message that you want to send")
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option
                .setName("anonim")
                .setDescription("Put yes to let the user know who you are, default is true")
                .setRequired(false)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [],

    run: async (client, interaction) => {
        const { options } = interaction;

        const user = options.getUser("user");
        const message = options.getString("message");
        let anon = options.getBoolean("anonim");
        if (anon == null) anon = true; // if boolean option is omitted default is true (anon message)

        try {
            if (anon) {
                await user.send(message);
                return await interaction.reply({ content: `Anonim message sent to ${user}`, ephemeral: true });
            }

            await user.send(`*User ${interaction.user} from ${interaction.guild.name} wants to told you:* ` + message);
            return await interaction.reply({ content: `Message sent to ${user}`, ephemeral: true });
        } catch (err) {
            console.log(err);
            return await interaction.reply({ content: "User hasn't enabled DMs or your message is too long!", ephemeral: true });
        }
    }
}