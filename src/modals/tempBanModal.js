const moderationSchema = require("../schemas/moderation");
const mConfig = require("../messageConfig.json");
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
    customId: "tempbanMdl",
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

        const banTime = fields.getTextInputValue("tempbanTime");
        const banReason = fields.getTextInputValue("tempbanReason");

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
                    case "y":
                        duration += value * 365 * 24 * 60 * 60 * 1000;
                        break;
                }
            }
            return duration;
        }

        const banDuration = parseDuration(banTime);

        const banEndTime = Math.floor((Date.now() + banDuration) / 1000);

        const bEmbed = new EmbedBuilder()
            .setAuthor({
                name: `${targetMember.user.username}`,
                iconURL: `${targetMember.user.displayAvatarURL({
                    dynamic: true,
                })}`,
            })
            .setDescription(
                `${targetMember.user.username} has been temporarily banned for ${banReason}! **(Ban will end: <t:${banEndTime}:R>)**`
            );

        await interaction.deferReply({ ephemeral: false });

        targetMember.ban({
            reason: `Temporarily banned for ${banReason} | Check logs for time`,
        });

        const maxTimeoutDuration = 2147483647;
        if (banDuration <= maxTimeoutDuration) {
            setTimeout(async () => {
                await guild.members.unban(targetMember.id);
            }, banDuration);
        } else {
            const remainingBanDuration = banDuration - maxTimeoutDuration;

            setTimeout(async () => {
                await guild.members.unban(targetMember.id);
            }, maxTimeoutDuration);

            setTimeout(async () => {
                await guild.members.unban(targetMember.id);
            }, remainingBanDuration);
        }

        const followUpMessage = await interaction.followUp({
            embeds: [bEmbed],
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

                    await externalGuild.bans.create(externalMember, {
                        reason: "Automatic multi-guilded ban.",
                    });

                    const lEmbed = new EmbedBuilder()
                        .setColor(mConfig.embedColorSuccess)
                        .setTitle("`⛔` User temp banned")
                        .setAuthor({
                            name: externalMember.user.username,
                            iconURL: externalMember.user.displayAvatarURL({ dynamic: true }),
                        })
                        .setDescription(
                            `\`💡\` To unban ${externalMember.user.username}, use \`/unban ${externalMember.user.id}\`.`
                        )
                        .addFields(
                            {
                                name: "Tempbanned by",
                                value: `<@${interaction.user.id}> for ${banReason}! **(Ban will end on: <t:${banEndTime}:R>)**`,
                                inline: true,
                            },
                            {
                                name: "Reason",
                                value: `Automatic multi-guilded temp ban.`,
                                inline: true,
                            }
                        )
                        .setFooter({
                            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
                            text: `${client.user.username} - Logging system`,
                        });

                    await externalLogChannel.send({ embeds: [lEmbed] });
                } catch (error) {
                    console.log(error);
                    continue;
                }
            }
        }

        let dataGD = await moderationSchema.findOne({ GuildID: guildId });

        const { LogChannelID } = dataGD;
        const loggingChannel = guild.channels.cache.get(LogChannelID);

        const lEmbed = new EmbedBuilder()
            .setColor(mConfig.embedColorSuccess)
            .setTitle("`⛔` User temp banned")
            .setAuthor({
                name: targetMember.user.username,
                iconURL: targetMember.user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(
                `\`💡\` To unban ${targetMember.user.username}, use \`/unban ${targetMember.user.id}\`.`
            )
            .addFields(
                {
                    name: "Tempbanned by",
                    value: `<@${interaction.user.id}> for ${banReason}! **(Ban will end on: <t:${banEndTime}:R>)**`,
                    inline: true,
                },
                {
                    name: "Reason",
                    value: `Automatic multi-guilded temp ban.`,
                    inline: true,
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
