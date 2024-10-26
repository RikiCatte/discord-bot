const moderationSchema = require("../schemas/moderation");
const mConfig = require("../messageConfig.json");
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    customId: "tempmuteMdl",
    userPermissions: [PermissionFlagsBits.BanMembers],
    banPermissions: [PermissionFlagsBits.BanMembers],
    run: async (client, interaction) => {
        const { message, guildId, guild, fields } = interaction;

        const embedAuthor = message.embeds[0].author;
        const guildMembers = await guild.members.fetch({
            query: embedAuthor.name,
            limit: 1,
        });
        const targetMember = guildMembers.first();

        const muteTime = fields.getTextInputValue("tempmuteTime");
        const muteReason = fields.getTextInputValue("tempmuteReason");

        function parseDuration(durationString) {
            const regex = /(\d+)([hmd])/g;
            let duration = 0;
            let match;

            while ((match = regex.exec(durationString))) {
                const value = parseInt(match[1]);
                const unit = match[2];

                switch (unit) {
                    case "h":
                        duration += value * 60 * 60 * 1000;
                        break;
                    case "d":
                        duration += value * 24 * 60 * 60 * 1000;
                        break;
                    case "m":
                        duration += value * 30.44 * 24 * 60 * 60 * 1000;
                        break;
                }
            }
            return duration;
        }

        const muteDuration = parseDuration(muteTime);
        const muteEndTime = Math.floor((Date.now() + muteDuration) / 1000);

        const mEmbed = new EmbedBuilder()
            .setAuthor({
                name: `${targetMember.user.username}`,
                iconURL: `${targetMember.user.displayAvatarURL({
                    dynamic: true,
                })}`,
            })
            .setDescription(
                `${targetMember.user.username} has been temporarily muted for ${muteReason}! **(Mute will end: <t:${muteEndTime}:R>)**`
            );

        await interaction.deferReply();

        const dataGD = await moderationSchema.findOne({ GuildID: guildId });
        const muteRoleId = dataGD.MuteRoleID;

        targetMember.roles.add(
            muteRoleId,
            `Tempmuted for ${muteReason} | Check logs for time`
        );

        setTimeout(async () => {
            targetMember.roles.remove(muteRoleId);
        }, muteDuration);

        const followUpMessage = await interaction.followUp({
            embeds: [mEmbed],
        });
        const followUpMessageId = followUpMessage.id;

        let dataMG = await moderationSchema.find({ MultiGuilded: true });

        if (dataMG) {
            let i;
            for (i = 0; i < dataMG.length; i++) {
                const { GuildID, LogChannelID } = dataMG[i];
                if (GuildID === interaction.guild.id) continue;

                const externalGuild = client.guilds.cache.get(GuildID);
                const externalLogChannel =
                    externalGuild.channels.cache.get(LogChannelID);
                const externalBot = await externalGuild.members.fetch(client.user.id);

                try {
                    const externalMember = await externalGuild.members.fetch(
                        targetMember.id
                    );

                    if (
                        externalMember.roles.highest.position >=
                        externalBot.roles.highest.position
                    )
                        continue;

                    await externalGuild.externalMember.roles.add(muteRoleId);

                    const lEmbed = new EmbedBuilder()
                        .setColor(mConfig.embedColorSuccess)
                        .setTitle("`⛔` User temp muted")
                        .setAuthor({
                            name: externalMember.user.username,
                            iconURL: externalMember.user.displayAvatarURL({ dynamic: true }),
                        })
                        .addFields(
                            {
                                name: "Tempmuted by",
                                value: `<@${interaction.user.id}>!`,
                                inline: true,
                            },
                            {
                                name: "Reason",
                                value: `Automatic multi-guiled temp mute.`,
                                inline: false,
                            },
                            {
                                name: "Duration",
                                value: `Mute will end on: <t:${muteEndTime}:R></t:$>`,
                                inline: false,
                            }
                        )
                        .setFooter({
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            text: `${client.user.username} - Logging system`,
                        });

                    await externalLogChannel.send({ embeds: [lEmbed] });
                } catch (e) {
                    console.log(e);
                    continue;
                }
            }
        }

        const { LogChannelID } = dataGD;
        const loggingChannel = guild.channels.cache.get(LogChannelID);

        const lEmbed = new EmbedBuilder()
            .setColor(mConfig.embedColorSuccess)
            .setTitle("`⛔` User temp muted")
            .setAuthor({
                name: targetMember.user.username,
                iconURL: targetMember.user.displayAvatarURL({ dynamic: true }),
            })
            .addFields(
                {
                    name: "Tempbanned by",
                    value: `<@${interaction.user.id}>`,
                    inline: true,
                },
                {
                    name: "Reason",
                    value: `${muteReason}`,
                    inline: true,
                },
                {
                    name: "Duration",
                    value: `Mute will end on: <t:${muteEndTime}:R>`,
                    inline: false,
                }
            )
            .setFooter({
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                text: `${client.user.username} - Logging system`,
            });

        await loggingChannel.send({ embeds: [lEmbed] });

        setTimeout(async () => {
            await interaction.channel.messages.delete(followUpMessageId);
        }, 2000);
        setTimeout(async () => {
            await message.delete();
        }, 2000);
    },
};
