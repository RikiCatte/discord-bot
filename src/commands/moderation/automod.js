const { SlashCommandBuilder, PermissionFlagsBits, Client, ChatInputCommandInteraction, ChannelType, EmbedBuilder } = require("discord.js");

const ms = require("ms");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("automod")
        .setDescription("MAnage the automod in your server")
        .addSubcommandGroup((sg) =>
            sg
                .setName("enable").setDescription("Enable a certain automod rule.")
                .addSubcommand((s) =>
                    s
                        .setName("flagged-words").setDescription("Block profanity sexual content and slurs.")
                        .addChannelOption((o) =>
                            o
                                .setName("channel")
                                .setDescription("The channel to send alerts to.")
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)
                        )
                )
                .addSubcommand((s) =>
                    s
                        .setName("spam-messages")
                        .setDescription("Blocks any messages suspected of spam.")
                        .addChannelOption((o) =>
                            o
                                .setName("channel")
                                .setDescription("The channel to send alerts to.")
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)
                        )
                )
                .addSubcommand((s) =>
                    s
                        .setName("mention-spam")
                        .setDescription("Block messages containing a certain amount of mentions.")
                        .addChannelOption((o) =>
                            o
                                .setName("channel")
                                .setDescription("The channel to send alerts to.")
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)
                        )
                        .addIntegerOption((o) =>
                            o
                                .setName("amount")
                                .setDescription("Set the limit of mentions a user can have in one message.")
                                .setRequired(true)
                        )
                        .addBooleanOption((o) =>
                            o
                                .setName("timeout")
                                .setDescription("Give the user a timeout when the rule is triggered.")
                                .setRequired(true)
                        )
                        .addStringOption((o) =>
                            o
                                .setName("time")
                                .setDescription("The time to timeout the user for.")
                                .setChoices(
                                    { name: "60 Seconds", value: "60s" },
                                    { name: "5 Minutes", value: "5m" },
                                    { name: "10 Minutes", value: "10m" },
                                    { name: "1 Hour", value: "1h" },
                                    { name: "1 Day", value: "1d" },
                                    { name: "1 Week", value: "1w" },
                                )
                        )
                )
                .addSubcommand((s) =>
                    s
                        .setName("keyword")
                        .setDescription("Block a message containing a certain keyword.")
                        .addChannelOption((o) =>
                            o
                                .setName("channel")
                                .setDescription("The channel to send alerts to.")
                                .addChannelTypes(ChannelType.GuildText)
                                .setRequired(true)
                        )
                        .addStringOption((o) =>
                            o
                                .setName("keyword")
                                .setDescription("The keyword to block.")
                                .setRequired(true)
                        )
                )
        )
        .addSubcommandGroup((sg) =>
            sg
                .setName("disable")
                .setDescription("Disable automod rules")
                .addSubcommand((s) =>
                    s
                        .setName("all")
                        .setDescription("Disable all automod rules")
                )
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.ManageGuild],
    botPermissions: [PermissionFlagsBits.ManageGuild],

    /**
     * 
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const { options, guild, user } = interaction;
        const subgrp = options.getSubcommandGroup();
        const sub = options.getSubcommand();
        let channel, rule;

        const eEmbed = new EmbedBuilder()
            .setTitle("Automod")
            .setDescription("`✅` | Succesfully enabled the automod system.")
            .setColor("Green")
            .setTimestamp();

        const dEmbed = new EmbedBuilder()
            .setTitle("Automod")
            .setDescription("`❌` | Succesfully disabled the automod system.")
            .setColor("Red")
            .setTimestamp();

        switch (subgrp) {
            case "enable":
                switch (sub) {
                    case "flagged-words":
                        await interaction.reply({ content: `<a:download:1237718881465012265> | Loading ...` });
                        channel = options.getChannel("channel");

                        rule = await guild.autoModerationRules.create({
                            name: "Block profanity, sexual content, and slurs. (BOT)",
                            enabled: true,
                            eventType: 1,
                            triggerType: 4,
                            triggerMetadata: {
                                presets: [1, 2, 3],
                            },
                            actions: [
                                {
                                    type: 1,
                                    metadata: {
                                        customMessage: `This message was prevented by ${client.user.username}'s automod system.`
                                    },
                                },
                                {
                                    type: 2,
                                    metadata: {
                                        channel, // oppure channel: channel,
                                    },
                                },
                            ],
                        }).catch(async (err) => {
                            await interaction.editReply({ content: "You cannot have more than 1 of this rule." });
                        });

                        if (!rule) return;

                        await interaction.editReply({ content: "", embeds: [eEmbed] });
                        break;

                    case "keyword":
                        await interaction.reply({ content: `<a:download:1237718881465012265> | Loading ...` });
                        const word = options.getString("keyword");
                        channel = options.getChannel("channel");

                        rule = await guild.autoModerationRules.create({
                            name: `Prevents ${word} from being used. (BOT)`,
                            enabled: true,
                            eventType: 1,
                            triggerType: 1,
                            triggerMetadata: {
                                keywordFilter: [`${word}`],
                            },
                            actions: [
                                {
                                    type: 1,
                                    metadata: {
                                        customMessage: `This message was prevented by ${client.user.username}'s automod system.`
                                    },
                                },
                                {
                                    type: 2,
                                    metadata: {
                                        channel,
                                    },
                                },
                            ],
                        }).catch(async (err) => {
                            await interaction.editReply({ content: "You cannot have more than 6 of this rule." });
                        });

                        if (!rule) return;

                        eEmbed.addFields({
                            name: "Blocked word",
                            value: `${word}`,
                        });

                        await interaction.editReply({ content: "", embeds: [eEmbed] });
                        break;

                    case "spam-messages":
                        await interaction.reply({ content: `<a:download:1237718881465012265> | Loading ...` });
                        channel = options.getChannel("channel");

                        rule = await guild.autoModerationRules.create({
                            name: "Prevent spam messages. (BOT)",
                            enabled: true,
                            eventType: 1,
                            triggerType: 3,
                            triggerMetadata: {},
                            actions: [
                                {
                                    type: 1,
                                    metadata: {
                                        customMessage: `This message was prevented by ${client.user.username}'s automod system.`
                                    },
                                },
                                {
                                    type: 2,
                                    metadata: {
                                        channel,
                                    },
                                },
                            ],
                        }).catch(async (err) => {
                            await interaction.editReply({ content: "You cannot have more than 1 of this rule." });
                        });

                        if (!rule) return;

                        await interaction.editReply({ content: "", embeds: [eEmbed] });
                        break;

                    case "mention-spam":
                        await interaction.reply({ content: `<a:download:1237718881465012265> | Loading ...` });
                        const limit = options.getInteger("amount");
                        const timeout = options.getBoolean("timeout");
                        channel = options.getChannel("channel");
                        let time = options.getString("time");

                        if (!time) time = "5m";

                        let timeSeconds = ms(time) / 1000;

                        switch (time) {
                            case "60s":
                                time = "60 seconds";
                                break;
                            case "5m":
                                time = "5 minutes";
                                break;
                            case "10m":
                                time = "10 minutes";
                                break;
                            case "1h":
                                time = "1 hour";
                                break;
                            case "1d":
                                time = "1 day";
                                break;
                            case "1w":
                                time = "1 week";
                                break;
                        }

                        if (timeout) {
                            rule = await guild.autoModerationRules.create({
                                name: "Prevent spam mentions. (BOT)",
                                enabled: true,
                                eventType: 1,
                                triggerType: 5,
                                triggerMetadata: {
                                    mentionTotalLimit: limit,
                                },
                                actions: [
                                    {
                                        type: 1,
                                        metadata: {
                                            customMessage: `This message was prevented by ${client.user.username}'s automod system.`
                                        },
                                    },
                                    {
                                        type: 2,
                                        metadata: {
                                            channel,
                                        },
                                    },
                                    {
                                        type: 3,
                                        metadata: { durationSeconds: timeSeconds },
                                    },
                                ],
                            }).catch(async (err) => {
                                await interaction.editReply({ content: "You cannot have more than 1 of this rule." });
                            });

                            if (!rule) return;

                            eEmbed.addFields(
                                { name: "Timeout", value: `%${timeout}` },
                                { name: "Time", value: `${time ? time : "N/A"}` }
                            )

                            await interaction.reply({ content: "", embeds: [eEmbed] });
                        }

                        rule = await guild.autoModerationRules.create({
                            name: "Prevent spam mentions. (BOT)",
                            enabled: true,
                            eventType: 1,
                            triggerType: 5,
                            triggerMetadata: {
                                mentionTotalLimit: limit,
                            },
                            actions: [
                                {
                                    type: 1,
                                    metadata: {
                                        customMessage: `This message was prevented by ${client.user.username}'s automod system.`
                                    },
                                },
                                {
                                    type: 2,
                                    metadata: {
                                        channel,
                                    },
                                },
                            ],
                        }).catch(async (err) => {
                            await interaction.editReply({ content: "You cannot have more than 1 of this rule." });
                        });

                        if (!rule) return;

                        eEmbed.addFields({ name: "Timeout?", value: `${timeout}` });

                        await interaction.editReply({ content: "", embeds: [eEmbed] });
                        break;
                }
            case "disable":
                switch (sub) {
                    case "all":
                        await interaction.reply({ content: `<a:download:1237718881465012265> | Loading ...` });

                        const rules = await guild.autoModerationRules.fetch();

                        rules.forEach(async (rule) => {
                            try {
                                await rule.delete({ reason: `Automod disabled by ${client.user.username}` });
                            }
                            catch (err) {
                                return await interaction.editReply({content: `There was an error deleting **${rule.name}**, remember that while you're in a community server you can't delete mentions spam rules!`})
                            }
                        });

                        await interaction.editReply({ content: "", embeds: [dEmbed] });
                        break;
                }
        }
    }
}