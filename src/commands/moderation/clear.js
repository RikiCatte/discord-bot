const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require("discord.js");
const mConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Deletes a specific number of messages provided.")
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("Amount of messages to delete from the channel.")
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true)
        )
        .addUserOption((option) =>
            option
                .setName("target")
                .setDescription(
                    "Messages to be deleted from a specific user in a channel."
                )
        ),
    userPermissions: [PermissionFlagsBits.ManageMessages],
    botPermissions: [PermissionFlagsBits.ManageMessages],

    run: async (client, interaction) => {
        const { options, channel } = interaction;
        let amount = options.getInteger("amount");
        const target = options.getUser("target");
        const multiMsg = amount === 1 ? "message" : "messages";

        if (!amount || amount > 100 || amount < 1)
            return await interaction.reply({ content: "Please specify an amount between 1 and 100 before deleting messages.", flags: MessageFlags.Ephemeral, });

        try {
            const channelMessages = await channel.messages.fetch();

            if (channelMessages.size === 0) {
                return await interaction.reply({
                    content: "There are no messages in this channel to delete.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (amount > channelMessages.size) amount = channelMessages.size;

            const clearEmbed = new EmbedBuilder().setColor(mConfig.embedColorSuccess);

            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            let messagesToDelete = [];

            if (target) {
                let i = 0;
                channelMessages.forEach((m) => {
                    if (m.author.id === target.id && messagesToDelete.length < amount) {
                        messagesToDelete.push(m);
                        i++;
                    }
                });

                clearEmbed.setDescription(`\`✅\` Succesfully cleared \`${messagesToDelete.length}\` ${multiMsg} from ${target} in ${channel}.`);
            } else {
                messagesToDelete = channelMessages.first(amount);
                clearEmbed.setDescription(`\`✅\` Succesfully cleared \`${messagesToDelete.length}\` ${multiMsg} in ${channel}.`);
            }

            if (messagesToDelete.length > 0) {
                await channel.bulkDelete(messagesToDelete, true);
            }

            await interaction.editReply({ embeds: [clearEmbed] });
        } catch (error) {
            await interaction.followUp({ content: "An error occured while clearing the messages.", flags: MessageFlags.Ephemeral, });
        }
    },
};
