const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const warningSchema = require("../../schemas/warning");
const msgConfig = require("../../messageConfig.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("warnings")
        .setDescription("Fully complete warning system.")
        .addSubcommand(subcommand =>
            subcommand.setName("add")
                .setDescription("Add a warning to a user.")
                .addUserOption(option =>
                    option.setName("target")
                        .setDescription("Select a user.")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName("reason")
                        .setDescription("Provide a reason.")
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName("evidence")
                        .setDescription("Provide a evidence.")
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("check")
                .setDescription("Check warnings of a user.")
                .addUserOption(option =>
                    option.setName("target")
                        .setDescription("Select a user.")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("remove")
                .setDescription("Remove a specific warning from a user.")
                .addUserOption(option =>
                    option.setName("target")
                        .setDescription("Select a user.")
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName("id")
                        .setDescription("Provide the warning's id.")
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName("clear")
                .setDescription("Clear all warnings from a user.")
                .addUserOption(option =>
                    option.setName("target")
                        .setDescription("Select a user.")
                        .setRequired(true)
                )
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],

    run: async (client, interaction) => {
        const { options, guildId, user, member } = interaction;

        const sub = options.getSubcommand(["add", "check", "remove", "clear"]);
        const target = options.getUser("target");
        const reason = options.getString("reason") || "No reason provided.";
        const evidence = options.getString("evidence") || "None provided.";
        const warnId = options.getInteger("id") - 1;
        const warnDate = new Date(interaction.createdTimestamp).toLocaleDateString();

        const userTag = `${target.username}#${target.discriminator}`;

        const embed = new EmbedBuilder();

        switch (sub) {
            case "add":
                var data = await warningSchema.findOne({ GuildID: guildId, UserID: target.id, UserTag: userTag });

                if (!data) {
                    data = new warningSchema({
                        GuildID: guildId,
                        UserID: target.id,
                        UserTag: userTag,
                        Content: [
                            {
                                ExecuterId: user.id,
                                ExecuterTag: user.tag,
                                Reason: reason,
                                Evidence: evidence,
                                Date: warnDate
                            }
                        ],
                    });
                } else {
                    const warnContent = {
                        ExecuterId: user.id,
                        ExecuterTag: user.tag,
                        Reason: reason,
                        Evidence: evidence,
                        Date: warnDate
                    }
                    if (!data.Content) {
                        data.Content = [warnContent];
                    } else {
                        data.Content.push(warnContent);
                    }
                }
                data.save();


                embed.setColor("Green")
                    .setDescription(`\`⚠️\` Warning added: ${userTag} | ||${target.id}||\n**Reason**: ${reason}\n**Evidence**: ${evidence}`)
                    .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                    .setTimestamp()
                    .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                interaction.reply({ embeds: [embed] });

                break;
            case "check":
                var data = await warningSchema.findOne({ GuildID: guildId, UserID: target.id, UserTag: userTag });

                if (data) {
                    embed.setColor("Green")
                        .setDescription(`${data.Content.map(
                            (w, i) =>
                                `**ID**: ${i + 1}
                            **By**: ${w.ExecuterTag}
                            **Date**: ${w.Date}
                            **Reason**: ${w.Reason}
                            **Evidence**: ${w.Evidence}
                            **Warning ID**: ${warnId}\n\n
                            `
                        ).join(" ")}`)
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                        .setTimestamp()

                    interaction.reply({ embeds: [embed] });
                } else {
                    embed.setColor("Red")
                        .setDescription(`${userTag} | ||${target.id}|| has no warnings.`)
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    interaction.reply({ embeds: [embed] });
                }


                break;
            case "remove":
                var data = await warningSchema.findOne({ GuildID: guildId, UserID: target.id, UserTag: userTag });

                if (data) {
                    data.Content.splice(warnId, 1);
                    data.save();

                    embed.setColor("Green")
                        .setDescription(`${userTag} | ||${target.id}||'s warning id: ${warnId + 1} has been removed.`)
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    interaction.reply({ embeds: [embed] });

                } else {
                    embed.setColor("Red")
                        .setDescription(`${userTag} | ||${target.id}|| has no warnings or the warning id is invalid.`)
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    interaction.reply({ embeds: [embed] });
                }

                break;
            case "clear":
                var data = await warningSchema.findOne({ GuildID: guildId, UserID: target.id, UserTag: userTag });

                if (data) {
                    await warningSchema.findOneAndDelete({ GuildID: guildId, UserID: target.id, UserTag: userTag });

                    embed.setColor("Green")
                        .setDescription(`${userTag}'s warnings were cleared. | User ID: ||${target.id}||`)
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    interaction.reply({ embeds: [embed] });

                } else {
                    embed.setColor("Red")
                        .setDescription(`${userTag} | ||${target.id}|| has no warnings.`)
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                        .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL });

                    interaction.reply({ embeds: [embed] });
                }
                break;
        }
    }
}