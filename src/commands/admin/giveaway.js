const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");

const BotConfig = require("../../schemas/BotConfig");
const { replyNoConfigFound, replyServiceNotEnabled } = require("../../utils/BotConfig");
const { formattedMsToSecs } = require("../../utils/timeUtils")
const updateServiceConfig = require("../../utils/BotConfig/updateServiceConfig");
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
                .addChannelOption((option) =>
                    option
                        .setName("channel")
                        .setDescription("The channel to send the giveaway message in")
                        .addChannelTypes(0) // 0 is for guild text channels
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
        let config = await BotConfig.findOne({ GuildID: interaction.guild.id });
        let serviceConfig = config?.services?.giveaway;

        if (!serviceConfig) return await replyNoConfigFound(interaction, "giveaway");
        if (!serviceConfig.enabled) return await replyServiceNotEnabled(interaction, "giveaway", "disabled", false);

        const { options } = interaction;
        let shuffledParticipants, shuffledWinners, channel, giveaway;
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

            giveaway = serviceConfig.giveaways.find(g => g.MessageID === messageId);
            if (!giveaway) return await interaction.reply({ content: "`⚠️` No giveaway found with that message ID", flags: MessageFlags.Ephemeral });

            channel = client.channels.cache.get(giveaway.ChannelID);
            message = await channel.messages.fetch(giveaway.MessageID);
        }

        let endTimestamp;
        let winnerCount;
        switch (options.getSubcommand()) {
            case "start":
                const prize = options.getString("prize");
                winnerCount = options.getInteger("winners");
                const time = options.getInteger("duration");
                const timeInMilliseconds = time * 60_000;
                const giveawayChannelID = options.getChannel("channel").id;
                endTimestamp = new Date(new Date().getTime() + timeInMilliseconds).getTime();

                embed = new EmbedBuilder()
                    .setTitle("\`🎉\` New Giveaway!")
                    .setDescription(`React with \`🎉\` to enter the giveaway for **${prize}**!\n\n\`⏱\` This giveaway will end <t:${Math.floor(endTimestamp / 1000)}:R>`)
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

                channel = client.channels.cache.get(giveawayChannelID);
                const giveawayMsg = await channel.send({ embeds: [embed], components: [row] });

                const newGiveaway = {
                    ChannelID: giveawayChannelID,
                    MessageID: giveawayMsg.id,
                    EndTimestamp: endTimestamp,
                    Prize: prize,
                    Ended: false,
                    Paused: false,
                    Participants: [],
                    WinnerCount: winnerCount,
                    Winners: []
                };

                serviceConfig.giveaways.push(newGiveaway);

                await updateServiceConfig(config, "giveaway", { giveaways: serviceConfig.giveaways });

                await interaction.reply({ content: `\`✅\` Giveaway Started in <#${giveawayChannelID}>`, flags: MessageFlags.Ephemeral });
                break;
            case "end":
                if (giveaway.Ended) return await interaction.reply({ content: "`⚠️` Giveaway is already ended!", flags: MessageFlags.Ephemeral });

                if (giveaway.Paused) return await interaction.reply({ content: "`⚠️` Giveaway is paused, you have to resume it first!", flags: MessageFlags.Ephemeral });

                shuffledParticipants = shuffleParticipants(giveaway.Participants);
                shuffledWinners = shuffledParticipants.slice(0, giveaway.WinnerCount);

                row = giveawayDisabledRow;

                if (!shuffledWinners.length) {
                    await interaction.reply({ content: "`⚠️` Giveaway Ended!", flags: MessageFlags.Ephemeral });

                    embed = new EmbedBuilder()
                        .setTitle("`🛑` Giveaway ended")
                        .setDescription(`This giveaway ended <t:${Math.floor(new Date().getTime() / 1000)}:R>`)
                        .addFields(
                            { name: "`🙋` Entries", value: `\`${giveaway.Participants.length}\``, inline: true },
                            { name: "`🏆` Winners", value: "*No one entered the giveaway*", inline: true }
                        )
                        .setColor("White")

                    const endMessage = await message.edit({ embeds: [embed], components: [row] });

                    await endMessage.reply("`⏱` *Giveaway ended, but no one joined.*");

                    giveaway.Ended = true;

                    await updateServiceConfig(config, "giveaway", { giveaways: serviceConfig.giveaways });
                } else {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setDescription("You ended the giveaway!")
                                .setColor("White")
                                .setTimestamp()
                        ], 
                        flags: MessageFlags.Ephemeral
                    })
                    mentions = shuffledWinners.map((winner) => `<@${winner}>`).join(", ");
                    embed = new EmbedBuilder()
                        .setTitle("`🛑` Giveaway ended")
                        .setDescription(`This giveaway ended <t:${Math.floor(new Date().getTime() / 1000)}:R>`)
                        .addFields(
                            { name: "`🙋` Entries", value: `\`${giveaway.Participants.length}\``, inline: true },
                            { name: "`🏆` Winners", value: `${mentions}`, inline: true }
                        )
                        .setColor("White")

                    const endMessage = await message.edit({ embeds: [embed], components: [row] });

                    await endMessage.reply({ content: `Congratulations ${mentions}! You won the **${giveaway.Prize}** giveaway!` });

                    giveaway.Ended = true;
                    giveaway.Winners = shuffledWinners;

                    await updateServiceConfig(config, "giveaway", { giveaways: serviceConfig.giveaways });
                }
                break;
            case "pause":
                if (giveaway.Ended) return await interaction.reply({ content: "`⚠️` Giveaway is ended!", flags: MessageFlags.Ephemeral });

                if (giveaway.Paused) return await interaction.reply({ content: "`⚠️` Giveaway is already paused!", flags: MessageFlags.Ephemeral });

                remainingTime = giveaway.EndTimestamp - new Date().getTime();

                giveaway.RemainingTime = remainingTime;
                giveaway.Paused = true;

                await updateServiceConfig(config, "giveaway", { giveaways: serviceConfig.giveaways });

                await interaction.reply({ content: "`✅` Giveaway paused successfully!", flags: MessageFlags.Ephemeral });

                const timeString = formattedMsToSecs(remainingTime);
                embed = new EmbedBuilder()
                    .setTitle("`⏸️` Giveaway paused")
                    .setDescription(`This giveaway was paused by: ${interaction.user.displayName}\n
                        Paused: <t:${Math.floor(new Date().getTime() / 1000)}:R>\n
                        Remaining Time: \`${timeString}\`` // vedere se funziona
                    )
                    .setColor("White");

                row = giveawayDisabledRow;
                message.edit({ embeds: [embed], components: [row] });
                break;
            case "resume":
                if (giveaway.Ended) return await interaction.reply({ content: "`⚠️` Giveaway is ended!", flags: MessageFlags.Ephemeral });

                if (giveaway.Paused == false) return await interaction.reply({ content: "`⚠️` Giveaway is not paused!", flags: MessageFlags.Ephemeral });

                const newEndTimeStamp = new Date().getTime() + giveaway.RemainingTime;

                giveaway.Paused = false;
                giveaway.EndTimestamp = newEndTimeStamp;
                winnerCount = giveaway.WinnerCount;
                delete giveaway.RemainingTime;
                await updateServiceConfig(config, "giveaway", { giveaways: serviceConfig.giveaways });

                embed = new EmbedBuilder()
                    .setTitle("\`🎉\` New Giveaway!")
                    .setDescription(`React with \`🎉\` to enter the giveaway for **${giveaway.Prize}**!\n\n\`⏱\` This giveaway will end <t:${Math.floor(newEndTimeStamp / 1000)}:R>`)
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

                await interaction.reply({ content: "`✅` Giveaway resumed successfully!", flags: MessageFlags.Ephemeral });

                break;
            case "reroll":
                if (giveaway.Ended == false) return await interaction.reply({ content: "`⚠️` Giveaway is not ended yet!", flags: MessageFlags.Ephemeral });

                if (giveaway.Paused) return await interaction.reply({ content: "`⚠️` Giveaway is paused!", flags: MessageFlags.Ephemeral });

                if (giveaway.Participants.length < giveaway.WinnerCount) return await interaction.reply({ content: "`⚠️` Not enough participants to reroll the giveaway!", flags: MessageFlags.Ephemeral });

                if (giveaway.Participants.length <= 1) return await interaction.reply({ content: "`⚠️` No participants found in order to reroll the giveaway!", flags: MessageFlags.Ephemeral });

                shuffledParticipants = shuffleParticipants(giveaway.Participants.slice());
                shuffledWinners = shuffledParticipants.slice(0, giveaway.WinnerCount);

                if (!shuffledWinners) return await interaction.reply({ content: "`⚠️` Rerolled giveaway but no new winners were selected!", flags: MessageFlags.Ephemeral })

                await interaction.reply({ content: "`✅` Giveaway rerolled successfully!", flags: MessageFlags.Ephemeral });

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

                await rerollMessage.reply({ content: `Congratulations ${mentions}! You won the rerolled giveaway for **${giveaway.Prize}** giveaway` });

                giveaway.Ended = true;
                giveaway.Winners = shuffledWinners;

                break;
            case "delete":
                await message.delete();

                serviceConfig.giveaways = serviceConfig.giveaways.filter(g => g.MessageID !== messageId);

                await updateServiceConfig(config, "giveaway", { giveaways: serviceConfig.giveaways });

                await interaction.reply({ content: "`✅` Giveaway successfully deleted!", flags: MessageFlags.Ephemeral });
                break;
        }
    }
}