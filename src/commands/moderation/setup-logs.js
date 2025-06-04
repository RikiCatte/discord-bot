const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js')
const logSchema = require("../../schemas/logs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup-logs")
        .setDescription("Design a logging channel for the audit logs.")
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Channel for logging messages.")
                .setRequired(false)
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    run: async (client, interaction) => {
        const { channel, guildId, options } = interaction;

        const logChannel = options.getChannel('channel') || channel;
        const embed = new EmbedBuilder();

        try {
            let data = await logSchema.findOne({ Guild: guildId });

            if (!data) {
                await logSchema.create({
                    Guild: guildId,
                    Channel: logChannel.id
                });

                embed.setDescription("Data was successfully sent to the database.")
                    .setColor("Green")
                    .setTimestamp();
            } else {
                await logSchema.findOneAndDelete({ Guild: guildId });
                await logSchema.create({
                    Guild: guildId,
                    Channel: logChannel.id
                });

                embed.setDescription("Old data was successfully replaced with newer.")
                    .setColor("Green")
                    .setTimestamp();
            }

            interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        } catch (err) {
            embed.setDescription("Something went wrong. Please contact DEVs")
                .setColor("Red")
                .setTimestamp();

            interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
    },
}