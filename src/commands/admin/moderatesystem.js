const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, MessageFlags } = require("discord.js");
const moderationSchema = require("../../schemas/moderation");
const mConfig = require("../../messageConfig.json");
const suspiciousUsers = require("../../suspiciousUsers.json"); // Level 3

module.exports = {
    data: new SlashCommandBuilder()
        .setName("moderatesystem")
        .setDescription("An advanced moderating system.")
        .addSubcommand(
            (s) =>
                s
                    .setName("configure")
                    .setDescription(
                        "Configures the advanced moderating system into the server."
                    )
                    .addChannelOption((o) =>
                        o
                            .setName("logging_channel")
                            .setDescription(
                                "The channel where all moderations will be logged."
                            )
                            .setRequired(true)
                            .addChannelTypes(ChannelType.GuildText)
                    )
                    .addRoleOption((o) =>
                        o
                            .setName("mute_role")
                            .setDescription("The role to use for muting members")
                            .setRequired(true)
                    )
                    .addBooleanOption(
                        (
                            o // Level 2
                        ) =>
                            o
                                .setName("multi_guilded")
                                .setDescription(
                                    "Adds your server on the list of allowing multi-guilded moderation."
                                )
                                .setRequired(true)
                    ) // Level 2
        )
        .addSubcommand((s) =>
            s
                .setName("remove")
                .setDescription(
                    "Removes the advanced moderation system from the server."
                )
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [],

    run: async (client, interaction) => {
        const { options, guildId, guild } = interaction;
        const subcmd = options.getSubcommand();
        if (!["configure", "remove"].includes(subcmd)) return;

        const rEmbed = new EmbedBuilder().setFooter({
            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
            text: `${client.user.username} - Advanced moderation system`,
        });

        switch (subcmd) {
            case "configure":
                const multiGuilded = options.getBoolean("multi_guilded"); // Level 2
                const muteRole = options.getRole("mute_role");
                const loggingChannel = options.getChannel("logging_channel");

                let dataGD = await moderationSchema.findOne({ GuildID: guildId });
                if (!dataGD) {
                    rEmbed
                        .setColor(mConfig.embedColorWarning)
                        .setDescription(
                            "`⌛` New server detected: Configuring the advanced moderation system..."
                        );

                    await interaction.reply({
                        embeds: [rEmbed],
                        fetchReply: true,
                        flags: MessageFlags.Ephemeral,
                    });

                    dataGD = new moderationSchema({
                        GuildID: guildId,
                        MultiGuilded: multiGuilded, // Level 2
                        MuteRoldID: muteRole.id,
                        LogChannelID: loggingChannel.id,
                    });
                    dataGD.save();

                    rEmbed
                        .setColor(mConfig.embedColorSuccess)
                        .setDescription(
                            `\`✅\` Successfully configured the advanced moderation system.`
                        )
                        .addFields(
                            {
                                // Level 2
                                name: "Multi-guilded",
                                value: `\`${multiGuilded ? "Yes" : "No"}\``,
                                inline: true,
                            }, // Level 2
                            {
                                name: "Mute Role",
                                value: `${muteRole}`,
                                inline: true,
                            },
                            {
                                name: "Logging channel",
                                value: `${loggingChannel}`,
                                inline: true,
                            }
                        );

                    setTimeout(() => {
                        interaction.editReply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
                    }, 2_000);

                    //Level 3
                    let i;
                    for (i = 0; i < suspiciousUsers.ids.length; i++) {
                        try {
                            const suspiciousUser = await guild.members.fetch(
                                suspiciousUsers.ids[i]
                            );

                            await guild.bans.create(suspiciousUser, {
                                deleteMessageSeconds: 60 * 60 * 24 * 7,
                                reason: "Suspicious user listed by developer.",
                            });

                            const lEmbed = new EmbedBuilder()
                                .setColor("White")
                                .setTitle("`⛔` User banned")
                                .setAuthor({
                                    name: suspiciousUser.username,
                                    iconURL: suspiciousUser.displayAvatarURL({ dynamic: true }),
                                    url: mConfig.author_link
                                })
                                .addFields(
                                    {
                                        name: "Banned by",
                                        value: `<@${client.user.id}>`,
                                        inline: true,
                                    },
                                    {
                                        name: "Reason",
                                        value: `\`Suspicious user listed by developer. Please contact the developer if this is a mistake.\``,
                                        inline: true,
                                    }
                                )
                                .setFooter({
                                    iconURL: `${client.user.displayAvatarURL({ dynamic })}`,
                                    text: `${client.user.username} - Logging system`,
                                });

                            loggingChannel.send({ embeds: [lEmbed] });
                        } catch (error) {
                            continue;
                        }
                    }
                    // Level 3
                } else {
                    await moderationSchema.findOneAndUpdate(
                        { GuildID: guildId },
                        {
                            MultiGuilded: multiGuilded,
                            MuteRoldID: muteRole.id,
                            LogChannelID: loggingChannel.id,
                        } // MultiGuilded Level 2
                    );

                    rEmbed
                        .setColor(mConfig.embedColorSuccess)
                        .setDescription(
                            `\`✅\` Successfully updated the advanced moderation system.`
                        )
                        .addFields(
                            {
                                // Level 2
                                name: "Multi-guilded",
                                value: `\`${multiGuilded ? "Yes" : "No"}\``,
                                inline: true,
                            }, // Level 2
                            {
                                name: "Mute Role",
                                value: `${muteRole}`,
                                inline: true,
                            },
                            {
                                name: "Logging channel",
                                value: `${loggingChannel}`,
                                inline: true,
                            }
                        );

                    interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
                }
                break;
            case "remove":
                const removed = await moderationSchema.findOneAndDelete({
                    GuildID: guildId,
                });
                if (removed) {
                    rEmbed
                        .setColor(mConfig.embedColorSuccess)
                        .setDescription(
                            `\`✅\` Successfully removed the advanced moderation system.`
                        );
                } else {
                    rEmbed
                        .setColor(mConfig.embedColorError)
                        .setDescription(
                            `\`❌\` This server isn't configured yet.\n\n\`💡\` Use \`/moderatesystem configure\` to start configuring this server`
                        );
                }
                interaction.reply({ embeds: [rEmbed], flags: MessageFlags.Ephemeral });
                break;
        }
    },
};
