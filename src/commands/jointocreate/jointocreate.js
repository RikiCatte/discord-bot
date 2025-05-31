const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");
const schema = require("../../schemas/join-to-create");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setup-jointocreate")
        .setDescription("Setup the join to create system.")
        .addChannelOption(option =>
            option.setName("channel")
                .setDescription("Channel of the join to create system.")
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true)
        )
        .addNumberOption(option =>
            option.setName("userlimit")
                .setDescription("The userlimit of every join to create channel.")
                .setMinValue(1)
                .setMaxValue(99)
                .setRequired(false)
        )
        .toJSON(),
    userPermisssions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [PermissionFlagsBits.ManageChannels],

    run: async (client, interaction) => {
        try {
            const { guild, options } = interaction;
            const channel = options.getChannel("channel");
            const userlimit = options.getNumber("userlimit") || 4;

            let data = await schema.findOne({ Guild: interaction.guild.id });

            if (data) {
                // If schema already exists, it updates it
                data.Channel = channel.id;
                data.UserLimit = userlimit;
                await data.save();
                interaction.reply({ content: "\`✅\` The join to create system has been updated!", flags: MessageFlags.Ephemeral });
            } else {
                // If schema not exists, it creates it
                data = new schema({
                    Guild: interaction.guild.id,
                    Channel: channel.id,
                    UserLimit: userlimit
                });
                await data.save();
                interaction.reply({ content: "\`✅\` The join to create system has been set up!", flags: MessageFlags.Ephemeral });
            }

        } catch (error) {
            console.error(error);
        }
    }
};