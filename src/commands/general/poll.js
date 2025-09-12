const { SlashCommandBuilder, Client, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const msgConfig = require("../../messageConfig.json");
const BotConfig = require("../../schemas/BotConfig");
const { replyNoConfigFound, replyServiceNotEnabled, updateServiceConfig } = require("../../utils/BotConfig")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create, end or manage a poll.')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('create')
                .setDescription('Create a poll.')
                .addStringOption((option) =>
                    option
                        .setName('question')
                        .setDescription('The question of the poll.')
                        .setRequired(true)
                )
                .addStringOption((option) =>
                    option
                        .setName("options")
                        .setDescription("The options of the poll. separated by a comma.")
                        .setRequired(true)
                )
                .addIntegerOption((option) =>
                    option
                        .setName("duration")
                        .setDescription("The duration of the poll in hours (1-168).")
                        .setMinValue(1)
                        .setMaxValue(168)
                )
                .addBooleanOption((option) =>
                    option
                        .setName("multiple-choice")
                        .setDescription("Whether the poll is multiple-choice or not.")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('end')
                .setDescription('End a poll.')
                .addStringOption((option) =>
                    option
                        .setName('message-id')
                        .setDescription("The message ID of the poll that you want to end.")
                        .setRequired(true)
                )
        )
        .addSubcommand((subcommand =>
            subcommand
                .setName("delete")
                .setDescription("Delete a poll (both from the database and from the Discord channel).")
                .addStringOption((option) =>
                    option
                        .setName("message-id")
                        .setDescription("The message ID of the poll you want to delete.")
                        .setRequired(true)
                )
        ))
        .addSubcommand((subcommand) =>
            subcommand
                .setName('delete-all')
                .setDescription("Delete all polls (both from the database and from the Discord channel).")
        )
        .toJSON(),
    userPermissions: [],
    botPermissions: [],

    /**
     * 
     * @param {Client} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        const serviceConfig = config.services?.poll;

        if (!config) return await replyNoConfigFound(interaction, "poll");
        if (!serviceConfig?.enabled) return await replyServiceNotEnabled(interaction, "poll");

        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case "create": {
                    const question = interaction.options.getString("question");
                    const options = interaction.options.getString("options").split(",");
                    const durationHours = interaction.options.getInteger("duration") || 1;
                    const multipleChoice = interaction.options.getBoolean("multiple-choice") || false;
                    const channel = interaction.guild.channels.cache.get(serviceConfig.ChannelID);

                    if (!channel) return await interaction.reply({ content: "`⚠️` The poll channel could not be found. Please check your configuration.", flags: MessageFlags.Ephemeral });

                    if (options.length < 2 || options.length > 10) return await interaction.reply({ content: "`⚠️` You need to provide at least 2 options and at most 10 options.", flags: MessageFlags.Ephemeral });

                    const pollData = {
                        allowMultiselect: multipleChoice,
                        answers: options.map((option) => ({ text: option.trim() })),
                        duration: durationHours,
                        question: { text: question }
                    };

                    const message = await channel.send({ poll: pollData });

                    serviceConfig.Polls.push({
                        MessageID: message.id,
                        Question: question,
                        Options: options,
                        Ended: false,
                        Votes: 0,
                        CreatedAt: new Date(),
                        EndsAt: new Date(Date.now() + durationHours * 60 * 60 * 1000)
                    });

                    await updateServiceConfig(config, "poll", { Polls: serviceConfig.Polls });

                    await interaction.reply({ content: `\`✅\` Poll created in <#${channel.id}>!`, flags: MessageFlags.Ephemeral });

                    break;
                }
                case "end": {
                    const messageId = interaction.options.getString("message-id");
                    const message = await interaction.channel.messages.fetch(messageId);

                    if (!message) return await interaction.reply({ content: "`⚠️` You provided an invalid message ID. Check that the message exist and is in this channel.", flags: MessageFlags.Ephemeral });

                    if (!message.poll) return await interaction.reply({ content: "`⚠️` The provided message is not a poll.", flags: MessageFlags.Ephemeral });

                    if (message.poll.resultsFinalized) return await interaction.reply({ content: "`⚠️` The poll has already ended.", flags: MessageFlags.Ephemeral });

                    const endedPoll = await message.poll.end();

                    await interaction.reply({ content: "`✅` Poll ended!", flags: MessageFlags.Ephemeral });

                    const embed = new EmbedBuilder()
                        .setAuthor({ name: `${client.user.username}`, iconURL: msgConfig.author_img })
                        .setThumbnail(msgConfig.thumbnail)
                        .setTitle("Poll Results")
                        .setColor("Blurple")
                        .setFooter({ text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL })
                        .setTimestamp()
                        .addFields(
                            {
                                name: "Ended by:",
                                value: `${interaction.user} (${interaction.user.id})`,
                            },
                            {
                                name: "Question:",
                                value: `${endedPoll.poll.question.text}`,
                            },
                            {
                                name: "All answers:",
                                value: `${endedPoll.poll.answers.map((answer) => `${answer.text} - ${answer.voteCount} votes`).join("\n")}`,
                            }
                        );

                    const DBPoll = serviceConfig.Polls.find((poll) => poll.MessageID === message.id);

                    if (DBPoll) {
                        DBPoll.Ended = true;
                        DBPoll.Votes = endedPoll.poll.answers.map(a => a.voteCount);
                    } else return interaction.reply({ content: "`⚠️` The poll could not be found in the database.", flags: MessageFlags.Ephemeral });

                    await updateServiceConfig(config, "poll", { Polls: serviceConfig.Polls });

                    await message.reply({ embeds: [embed] });

                    break;
                }
                case "delete": {
                    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: "`⚠️` You need to be an administrator to use this command.", flags: MessageFlags.Ephemeral });

                    const messageId = interaction.options.getString("message-id");
                    const poll = serviceConfig.Polls.find((p) => p.MessageID === messageId);

                    if (!poll) return await interaction.reply({ content: "`⚠️` A poll with the provided message ID could not be found in the database.", flags: MessageFlags.Ephemeral });

                    serviceConfig.Polls = serviceConfig.Polls.filter((p) => p.MessageID !== messageId);

                    await updateServiceConfig(config, "poll", { Polls: serviceConfig.Polls });

                    const channel = interaction.guild.channels.cache.get(serviceConfig.ChannelID);
                    if (channel) {
                        const message = await channel.messages.fetch(messageId).catch(() => null);
                        if (message) await message.delete().catch(() => null);
                        else return await interaction.reply({ content: "`⚠️` The poll message could not be found in the channel, but it should have been removed from the database.", flags: MessageFlags.Ephemeral });
                    }

                    await interaction.reply({ content: `\`✅\` Poll \`${poll.Question}\` successfully deleted from the database.`, flags: MessageFlags.Ephemeral });

                    break;
                }
                case "delete-all": {
                    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return await interaction.reply({ content: "`⚠️` You need to be an administrator to use this command.", flags: MessageFlags.Ephemeral });

                    let pollCount = serviceConfig.Polls.length;

                    if (pollCount === 0) return await interaction.reply({ content: "`⚠️` There are no polls in the database to delete.", flags: MessageFlags.Ephemeral });

                    serviceConfig.Polls = [];

                    await updateServiceConfig(config, "poll", { Polls: serviceConfig.Polls });

                    const channel = interaction.guild.channels.cache.get(serviceConfig.ChannelID);
                    if (channel) {
                        const fetchedMessages = await channel.messages.fetch({ limit: 100 });
                        const pollMessages = fetchedMessages.filter(m => m.poll);
                        for (const message of pollMessages.values()) {
                            await message.delete().catch(() => null);
                        }
                    }

                    await interaction.reply({ content: `\`✅\` Successfully deleted all (${pollCount}) polls from the database.`, flags: MessageFlags.Ephemeral });

                    break;
                }
            }
        } catch (error) {
            console.log('[ERROR]'.red, " Error in polls.js run function.")
            console.log(error);
        }
    }
}