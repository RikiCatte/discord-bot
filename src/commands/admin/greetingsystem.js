const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, MessageFlags } = require("discord.js");
const greetingSchema = require("../../schemas/greeting");
const { profileImage } = require("discord-arts");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("greetingsystem")
        .setDescription("An advanced greeting system.")
        .addSubcommandGroup((sg) =>
            sg
                .setName("welcome")
                .setDescription("Sending a message when someone joins")
                .addSubcommand((s) =>
                    s
                        .setName("configure")
                        .setDescription("Enables the welcome part of the greeting system")
                        .addChannelOption((o) =>
                            o
                                .setName("channel")
                                .setDescription("The channel where the welcome message should be send.")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildText)
                        )
                        .addStringOption((o) =>
                            o
                                .setName("message")
                                .setDescription("The message to send to the channel, use <user> to mention their user tag")
                                .setRequired(true)
                                .setMaxLength(15)
                        )
                        .addStringOption((o) =>
                            o
                                .setName("border-color")
                                .setDescription("The border color of the image in HEX-code (e.g. FFFFFF)")
                                .setRequired(true)
                                .setMinLength(6)
                                .setMaxLength(6)
                        )
                )
                .addSubcommand((s) =>
                    s
                        .setName("enable")
                        .setDescription("Enables the welcome part of the greeting system")
                )
                .addSubcommand((s) =>
                    s
                        .setName("disable")
                        .setDescription("Disables the welcome part of the greeting system")
                )
        )
        .addSubcommandGroup((sg) =>
            sg
                .setName("goodbye")
                .setDescription("Sending a message when someone leaves")
                .addSubcommand((s) =>
                    s
                        .setName("configure")
                        .setDescription("Enables the goodbye part of the greeting system")
                        .addChannelOption((o) =>
                            o
                                .setName("channel")
                                .setDescription("The channel where the goodbye message should be send.")
                                .setRequired(true)
                                .addChannelTypes(ChannelType.GuildText)
                        )
                        .addStringOption((o) =>
                            o
                                .setName("message")
                                .setDescription("The message to send to the channel, use <user> to mention their user tag")
                                .setRequired(true)
                                .setMaxLength(15)
                        )
                        .addStringOption((o) =>
                            o
                                .setName("border-color")
                                .setDescription("The border color of the image in HEX-code (e.g. FFFFFF)")
                                .setRequired(true)
                                .setMinLength(6)
                                .setMaxLength(6)
                        )
                )
                .addSubcommand((s) =>
                    s
                        .setName("enable")
                        .setDescription("Enables the goodbye part of the greeting system")
                )
                .addSubcommand((s) =>
                    s
                        .setName("disable")
                        .setDescription("Disables the goodbye part of the greeting system")
                )
        )
        .addSubcommand((s) =>
            s
                .setName("remove")
                .setDescription("Removes the greeting system from this server.")
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.SendMessages],

    run: async (client, interaction) => {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const { options, guildId, user } = interaction;

        let channel, message, borderColor, image, newData = false;

        const subcommandGroup = options.getSubcommandGroup();
        const type = subcommandGroup?.charAt(0).toUpperCase() + subcommandGroup?.slice(1);

        let data = await greetingSchema.findOne({ GuildID: guildId });

        switch (options.getSubcommand()) {
            case "configure":
                channel = options.getChannel("channel");
                message = options.getString("message");
                borderColor = options.getString("border-color");

                if (!/^[0-9A-F]{6}$/i.test(borderColor)) {
                    return await interaction.editReply({ content: "The border color must be a valid HEX-code (e.g. FFFFFF)" })
                }

                if (!data) {
                    data = await new greetingSchema({
                        GuildID: guildId,
                        Welcome: {
                            Enabled: false,
                            ChannelID: "",
                            Message: "",
                            BorderColor: ""
                        },
                        Goodbye: {
                            Enabled: false,
                            ChannelID: "",
                            Message: "",
                            BorderColor: ""
                        }
                    }).save().catch((err) => console.error(err));

                    newData = true;
                };

                if (data[type].ChannelID === "") {
                    newData = true;
                }

                const dataObject = {
                    Enabled: true,
                    ChannelID: channel.id,
                    Message: message,
                    BorderColor: borderColor
                };

                type === "Welcome"
                    ? await greetingSchema.findOneAndUpdate({ Guild: guildId }, { Welcome: dataObject })
                    : await greetingSchema.findOneAndUpdate({ Guild: guildId }, { Goodbye: dataObject });

                if (message.includes("<user>")) {
                    message = message.replace("<user>", `@${user.username}`)
                }

                try {
                    image = await profileImage(user.id, {
                        presenceStatus: "phone",
                        borderColor: borderColor,
                        customTag: message,
                        customDate: new Date().toLocaleDateString(),
                        customBackground: user.bannerURL({ forceStatic: true })
                    })
                } catch (e) {
                    console.error(e);
                    return await interaction.editReply({ content: `An error occurred: ${e.message}`, flags: MessageFlags.Ephemeral });
                }

                newData
                    ? await interaction.editReply({ content: `the ${type.toLowerCase()} message have been created.\nHere is the preview of the image:`, files: [image], flags: MessageFlags.Ephemeral })
                    : await interaction.editReply({ content: `the ${type.toLowerCase()} message have been updated.\nHere is the preview of the image:`, files: [image], flags: MessageFlags.Ephemeral });

                break;

            case "enable":
                if (!data) {
                    return await interaction.editReply({ content: "This server has not set up this system yet. Use \`/greetingsystem welcome configure\` or \`/greetingsystem goodbye configure\` to get started", flags: MessageFlags.Ephemeral });
                }

                if (data[type].Enabled) {
                    return await interaction.editReply({ content: `The ${type.toLowerCase()} messages are already enabled`, flags: MessageFlags.Ephemeral });
                }

                type === "Welcome"
                    ? await greetingSchema.findOneAndUpdate({ Guild: guildId }, { "Welcome.Enabled": true })
                    : await greetingSchema.findOneAndUpdate({ Guild: guildId }, { "Goodbye.Enabled": true });

                await interaction.editReply({ content: `The ${type.toLowerCase()} messages have been enabled`, flags: MessageFlags.Ephemeral });
                break;

            case "disable":
                if (!data) {
                    return await interaction.editReply({ content: "This server has not set up this system yet. Use \`/greetingsystem welcome configure\` or \`/greetingsystem goodbye configure\` to get started", flags: MessageFlags.Ephemeral });
                }

                if (data[type].Enabled) {
                    return await interaction.editReply({ content: `The ${type.toLowerCase()} messages are already disabled`, flags: MessageFlags.Ephemeral });
                }

                type === "Welcome"
                    ? await greetingSchema.findOneAndUpdate({ Guild: guildId }, { "Welcome.Enabled": false })
                    : await greetingSchema.findOneAndUpdate({ Guild: guildId }, { "Goodbye.Enabled": false });

                await interaction.editReply({ content: `The ${type.toLowerCase()} messages have been disabled`, flags: MessageFlags.Ephemeral });
                break;

            case "remove":
                if (!data) {
                    return await interaction.editReply({ content: "This server has not set up this system yet. Use \`/greetingsystem welcome configure\` or \`/greetingsystem goodbye configure\` to get started", flags: MessageFlags.Ephemeral });
                }

                await greetingSchema.findOneAndDelete({ Guild: guildId });

                await interaction.editReply({ content: "The greeting system has been removed from this server", flags: MessageFlags.Ephemeral });
                break;
        }
    }
}