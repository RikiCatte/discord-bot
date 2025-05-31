const { SlashCommandBuilder, Client, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } = require('discord.js');
const msgConfig = require("../../messageConfig.json");

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
                        .setDescription("The duration of the poll in hours.")
                )
                .addBooleanOption((option) =>
                    option
                        .setName("multiple-choice")
                        .setDescription("Whether the poll is multiple-choice or not.")
                )
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("The channel where the poll will be created.")
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('end')
                .setDescription('End a poll.')
                .addStringOption((option) =>
                    option
                        .setName('message-id')
                        .setDescription('The message ID of the poll that you want to end.')
                        .setRequired(true)
                )
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
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case "create":
                    const question = interaction.options.getString("question");
                    const options = interaction.options.getString("options").split(",");
                    const duration = interaction.options.getInteger("duration") || 24;
                    const multipleChoice = interaction.options.getBoolean("multiple-choice") || false;
                    const channel = interaction.options.getChannel("channel") || interaction.channel;

                    if (options.length < 2 || options.length > 10) {
                        return await interaction.reply({ content: "You need to provide at least 2 options and at most 10 options.", flags: MessageFlags.Ephemeral });
                    }

                    await channel.send({
                        poll: {
                            question: { text: question },
                            duration,
                            allowMultiselect: multipleChoice,
                            answers: options.map((option) => ({ text: option })),
                        },
                    });

                    await interaction.reply({ content: "Poll created!", flags: MessageFlags.Ephemeral });

                    break;
                case "end":
                    const messageId = interaction.options.getString("message-id");
                    const message = await interaction.channel.messages.fetch(messageId);

                    if (!message) {
                        return await interaction.reply({ content: "You provided an invalid message ID. Check that the message exist and is in this channel.", flags: MessageFlags.Ephemeral });
                    }

                    if (!message.poll) {
                        return await interaction.reply({ content: "The provided message is not a poll.", flags: MessageFlags.Ephemeral });
                    }

                    if (message.poll.resultsFinalized) {
                        return await interaction.reply({ content: "The poll has already ended.", flags: MessageFlags.Ephemeral });
                    }

                    const endedPoll = await message.poll.end();

                    await interaction.reply({ content: "Poll ended!", flags: MessageFlags.Ephemeral });

                    const embed = new EmbedBuilder()
                        .setAuthor({name: `${client.user.username}`, iconURL: msgConfig.author_img})
                        .setThumbnail(msgConfig.thumbnail)
                        .setTitle("Poll Results")
                        .setColor("Blurple")
                        .setFooter({text: msgConfig.footer_text, iconURL: msgConfig.footer_iconURL})
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

                        await message.reply({embeds: [embed]});
            }
        } catch (error) {
            console.log('[ERROR]'.red, " Error in polls.js run function.")
            console.log(error);
        }
    }
}