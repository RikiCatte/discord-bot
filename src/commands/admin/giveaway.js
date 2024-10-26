const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits } = require("discord.js");

const giveawaySchema = require("../../schemas/giveaways");
const shuffleParticipants = require("../../utils/giveaways/shuffleParticipants");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("An advanced giveaway system")
        .addSubcommand((sub) =>
            sub
                .setName("start")
                .setDescription("Starts a giveaway.")
                .addStringOption((option) =>
                    option
                        .setName("prize")
                        .setDescription("The prize to giveaway")
                        .setRequired(true)
                )
                .addIntegerOption((option) =>
                    option
                        .setName("winners")
                        .setDescription("The number of winners")
                        .setRequired(true)
                )
                .addIntegerOption((option) =>
                    option
                        .setName("duration")
                        .setDescription("The duration of the giveaway in minutes")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("end")
                .setDescription("Ends a giveaway")
                .addStringOption((option) =>
                    option
                        .setName("message-id")
                        .setDescription("The message ID of the giveaway")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("pause")
                .setDescription("Pauses a giveaway")
                .addStringOption((option) =>
                    option
                        .setName("message-id")
                        .setDescription("The message ID of the giveaway")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("resume")
                .setDescription("Resumes a giveaway")
                .addStringOption((option) =>
                    option
                        .setName("message-id")
                        .setDescription("The message ID of the giveaway")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("reroll")
                .setDescription("Rerolls a giveaway")
                .addStringOption((option) =>
                    option
                        .setName("message-id")
                        .setDescription("The message ID of the giveaway")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("delete")
                .setDescription("Deletes a giveaway")
                .addStringOption((option) =>
                    option
                        .setName("message-id")
                        .setDescription("The message ID of the giveaway")
                        .setRequired(true)
                )
        )
        .toJSON(),
    userPermissions: [PermissionFlagsBits.Administrator],
    botPermissions: [],

    run: async (client, interaction) => {
        const { options } = interaction;
        let shuffledParticipants, shuffledWinners, channel, schema;
        let mentions, row, embed, messageId, message, remainingTime;

        const giveawayDisabledRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("-")
                .setLabel("🎉")
                .setDisabled(true)
                .setStyle(ButtonStyle.Secondary)
        );

        if (options.getSubcommand() != "start") {
            messageId = options.getString("message-id");

            schema = await giveawaySchema.findOne({ MessageID: messageId });
            if (!schema) return interaction.reply({ content: "No giveaway was found with that message ID", ephemeral: true });

            channel = client.channels.cache.get(schema.ChannelID);
            message = await channel.messages.fetch(schema.MessageID);
        }

        let endTimestamp;
        let winnerCount;
        switch (options.getSubcommand()) {
            case "start":
                const prize = options.getString("prize");
                winnerCount = options.getInteger("winners");
                const time = options.getInteger("duration");
                const timeInMilliseconds = time * 60_000;
                endTimestamp = new Date(new Date().getTime() + timeInMilliseconds).getTime();

                embed = new EmbedBuilder()
                    .setTitle("🎉 Giveaway 🎉")
                    .setDescription(`React with 🎉 to enter the giveaway for **${prize}**!\n\n\`⏱\` This giveaway will end <t:${Math.floor(endTimestamp / 1000)}:R>`)
                    .addFields(
                        { name: "`🙋` Entries", value: "`0`", inline: true },
                        { name: "`🏆` Winners", value: `\`${winnerCount}\``, inline: true }
                    )
                    .setColor("White")
                    .setTimestamp(endTimestamp);

                row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("giveawayBtn")
                        .setLabel("🎉")
                        .setStyle(ButtonStyle.Secondary)
                );

                const giveawayMsg = await interaction.channel.send({ embeds: [embed], components: [row] });

                const giveawayData = new giveawaySchema({
                    Ended: false,
                    Paused: false,
                    GuildID: interaction.guild.id,
                    ChannelID: interaction.channel.id,
                    MessageID: `${giveawayMsg.id}`,
                    EndTimestamp: endTimestamp,
                    Prize: prize,
                    Participants: [],
                    WinnerCount: winnerCount
                });

                await giveawayData.save().catch((err) => console.log(err));

                interaction.reply({ content: "Giveaway Started!", ephemeral: true });
                break;

            case "end":
                if (schema.Ended) return interaction.reply({ content: "Giveaway has already ended!", ephemeral: true });

                if (schema.Paused) return interaction.reply({ content: "Giveaway is paused!", ephemeral: true });

                shuffledParticipants = shuffleParticipants(schema.Participants);
                shuffledWinners = shuffledParticipants.slice(0, schema.WinnerCount);

                row = giveawayDisabledRow;

                if (!shuffledWinners.length) {
                    interaction.reply({ content: "Giveaway Ended!", ephemeral: true });

                    embed = new EmbedBuilder()
                        .setTitle("`🛑` Giveaway ended")
                        .setDescription(`This giveaway ended <t:${Math.floor(new Date().getTime() / 1000)}:R>`)
                        .addFields(
                            { name: "`🙋` Entries", value: `\`${schema.Participants.length}\``, inline: true },
                            { name: "`🏆` Winners", value: "*No one entered the giveaway*", inline: true }
                        )
                        .setColor("White")

                    const endMessage = await message.edit({ embeds: [embed], components: [row] });

                    endMessage.reply("*Giveaway ended, but no one joined the giveaway.*");

                    schema.Ended = true;
                    await schema.save().catch((err) => console.log(err));
                } else {
                    interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription("Ended the giveaway!")
                                .setColor("White")
                                .setTimestamp()
                        ], ephemeral: true
                    })
                    mentions = shuffledWinners.map((winner) => `<@${winner}>`).join(", ");
                    embed = new EmbedBuilder()
                        .setTitle("`🛑` Giveaway ended")
                        .setDescription(`This giveaway ended <t:${Math.floor(new Date().getTime() / 1000)}:R>`)
                        .addFields(
                            { name: "`🙋` Entries", value: `\`${schema.Participants.length}\``, inline: true },
                            { name: "`🏆` Winners", value: `${mentions}`, inline: true }
                        )
                        .setColor("White")

                    const endMessage = await message.edit({ embeds: [embed], components: [row] });

                    endMessage.reply({ content: `Congratulations ${mentions}! You won the **${schema.Prize}** giveaway!` });

                    schema.Ended = true;
                    await schema.save().catch((err) => console.log(err));
                }
                break;

            case "pause":
                if (schema.Ended) return interaction.reply({ content: "Giveaway has already ended!", ephemeral: true });

                if (schema.Paused) return interaction.reply({ content: "Giveaway is already paused!", ephemeral: true });

                remainingTime = schema.EndTimestamp - new Date().getTime();

                schema.RemainingTime = remainingTime;
                schema.Paused = true;

                await schema.save().catch((err) => console.log(err));

                await interaction.reply({ content: "Giveaway paused successfully!", ephemeral: true });

                embed = new EmbedBuilder()
                    .setTitle("`⏸` Giveaway paused")
                    .setDescription(`This giveaway was paused by: ${interaction.user.displayName}\n
                        Paused: <t:${Math.floor(new Date().getTime() / 1000)}:R>\n
                        Remaining Time: \`${Math.floor(remainingTime / 1000)} seconds\``
                    )
                    .setColor("White");

                row = giveawayDisabledRow;
                message.edit({ embeds: [embed], components: [row] });
                break;

            case "resume":
                if (schema.Ended) return interaction.reply({ content: "Giveaway has already ended!", ephemeral: true });

                if (schema.Paused == false) return interaction.reply({ content: "Giveaway is not paused!", ephemeral: true });

                const newEndTimeStamp = new Date().getTime() + schema.RemainingTime;

                schema.Paused = false;
                schema.EndTimestamp = newEndTimeStamp;
                winnerCount = schema.WinnerCount;
                delete schema.RemainingTime;
                await schema.save().catch((err) => console.log(err));

                embed = new EmbedBuilder()
                    .setTitle("🎉 Giveaway 🎉")
                    .setDescription(`React with 🎉 to enter the giveaway for **${schema.Prize}**!\n\n\`⏱\` This giveaway will end <t:${Math.floor(newEndTimeStamp / 1000)}:R>`)
                    .addFields(
                        { name: "`🙋` Entries", value: "`0`", inline: true },
                        { name: "`🏆` Winners", value: `\`${winnerCount}\``, inline: true }
                    )
                    .setColor("White")
                    .setTimestamp(newEndTimeStamp);

                row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("giveawayBtn")
                        .setLabel("🎉")
                        .setStyle(ButtonStyle.Secondary)
                );

                message.edit({ embeds: [embed], components: [row] });

                await interaction.reply({ content: "Giveaway resumed succesfully!", ephemeral: true });

                break;

            case "reroll":
                if (schema.Ended == false) return interaction.reply({ content: "Giveaway has not already ended!", ephemeral: true });

                if (schema.Paused) return interaction.reply({ content: "Giveaway is paused!", ephemeral: true });

                shuffledParticipants = shuffleParticipants(schema.Participants.slice());
                shuffledWinners = shuffledParticipants.slice(0, schema.WinnerCount);

                if (!shuffledWinners) return interaction.reply({ content: "Rerolled giveaway but no new winners were selected!", ephemeral: true })

                interaction.reply({ content: "Giveaway rerolled successfully!", ephemeral: true });

                mentions = shuffledWinners.map((winner) => `<@${winner}>`).join(", ");

                embed = new EmbedBuilder()
                    .setTitle("`🔁` Giveaway rerolled")
                    .setDescription(`This giveaway was rerolled by: ${interaction.user.displayName}\n
                        Rerolled: <t:${Math.floor(new Date().getTime() / 1000)}:R>\n
                        New Winners: ${mentions}`
                    )
                    .setColor("FFFFFF");

                row = giveawayDisabledRow;

                const rerollMessage = await message.edit({ embeds: [embed], components: [row] });

                rerollMessage.reply({ content: `Congratulations ${mentions}! You won the rerolled giveaway for **${schema.Prize}** giveaway` });

                break;

            case "delete":
                await message.delete();
                await giveawaySchema.findOneAndDelete({ MessageID: messageId });

                interaction.reply({
                    content: "Giveaway deleted successfully!",
                    ephemeral: true,
                });
                break;
        }
    }
}