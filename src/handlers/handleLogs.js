const { EmbedBuilder, Events, AuditLogEvent, ActionRowBuilder, ButtonBuilder, ButtonStyle, DMChannel, GuildChannel, GuildMember, AutoModerationActionExecution, GuildAuditLogsEntry, PollAnswer, MessageReaction, ThreadChannel, ThreadMember, TextChannel, NewsChannel, VoiceChannel, StageChannel, ForumChannel, MediaChannel, Embed } = require("discord.js");
const msgConfig = require("../messageConfig.json");
const serverStatsCategoryId = msgConfig.serverStats_Category;
const getColorName = require("../utils/getColorName.js");
const getDifferences = require("../utils/getDifferences.js");
const getPermissionDifferences = require("../utils/getPermissionDifferences.js");
const formatPermissions = require("../utils/formatPermissions.js");
const validateEmbedFields = require("../utils/validateEmbedFields.js");
const updateServiceConfig = require("../utils/BotConfig/updateServiceConfig");
const BotConfig = require("../schemas/BotConfig.js");
const { profileImage } = require("discord-arts");

module.exports = (client) => {
    /**
     * Sends the Log in the designated channel (channel ID inside .json file)
     * @param {Embed | string} embed 
     * @param {boolean} raidRisk 
     * @param {int} channelId 
     * @param {string} logTitle 
     */
    async function sendLog(embed, raidRisk, channelId, logTitle) {
        const config = await BotConfig.findOne({ GuildID: msgConfig.guild });
        const logsService = config?.services?.logs;
        if (!logsService || !logsService.enabled) return;

        const logChannel = client.channels.cache.get(logsService.LogChannelID);
        const staffChannel = client.channels.cache.get(logsService.StaffChannelID);

        if (!logChannel || !staffChannel)
            return console.log("[LOGGING SYSTEM][ERROR] Error with ChannelID, check your Bot Config!".red);

        if (embed === "apiError") {
            const embed = new EmbedBuilder()
                .setTitle(msgConfig.discordApiError)
                .setColor("NotQuiteBlack")
                .addFields({ name: "Error", value: `Discord API failure occurred while trying to retrieve event data of \`${raidRisk}\`. Consider to manually check what happened.` })
                .addFields({ name: "Risk", value: msgConfig.discordApiError })
                .setFooter({ text: "Mod Logging System by RikiCatte", iconURL: msgConfig.footer_iconURL })
                .setTimestamp()
            try {
                return await logChannel.send({ embeds: [embed] });
            } catch {
                return console.log("[LOGGING SYSTEM][ERROR] Error with sending API Error message!".red);
            }
        }

        // Validate embed fields. (prevents crashes if fields are not strings)
        embed = await validateEmbedFields(embed);

        embed.setFooter({ text: "Mod Logging System by RikiCatte", iconURL: msgConfig.footer_iconURL });
        embed.setTimestamp();

        try {
            await logChannel.send({ embeds: [embed] });

            if (raidRisk) {
                const button = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`logSystem`)
                            .setStyle(ButtonStyle.Success)
                            .setLabel("✅ Mark as Solved")
                    )

                let msg = await staffChannel.send({ content: `@here Please pay attention!`, embeds: [embed], components: [button] });

                const date = new Date();
                const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}`;

                logsService.RiskyLogs.push({
                    RiskyLogID: msg.id,
                    ChannelID: channelId,
                    Guild: msg.guildId,
                    Title: logTitle,
                    Date: formattedDate,
                    Solved: false,
                }).catch((err) => console.log(err)); ù

                await updateServiceConfig(config, "logs", { RiskyLogs: logsService.RiskyLogs });
            }

            return;
        } catch (err) {
            console.log(err);
            return await logChannel.send("Error occured with: " + embed);
        }
    }

    /**
     * Emitted whenever permissions for an application command in a guild were updated. 
     * This includes permission updates for other applications in addition to the logged in client,
     * check data.applicationId to verify which application the update is for
     * @param {ApplicationCommandPermissionsUpdateData} data
     */
    client.on(Events.ApplicationCommandPermissionsUpdate, (data) => {
        const embed = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle("\`🟡\` Application Command permissions Updated")
            .addFields({ name: "Application ID", value: `${data.applicationId}`, inline: true })
            .addFields({ name: "Updated Command / Global Entity ID", value: `${data.id}`, inline: true })
            .addFields({ name: "Role / User / Channel ID [Has Permission]", value: `${data.permissions.id} [${data.permissions.permission}]`, inline: false })
            .addFields({ name: "Type", value: `Permission is for ${data.permissions.type}`, inline: true })
            .addFields({ name: "Risk", value: msgConfig.moderateRisk })

        return sendLog(embed);
    })

    /**
     * Emitted whenever an auto moderation rule is triggered. This event requires the PermissionFlagsBits permission.
     * @param {AutoModerationActionExecution} automodAction
     */
    client.on(Events.AutoModerationActionExecution, (automodAction) => {
        let title = "\`🟣\` AutoModeration Action Triggered"

        const fields = [
            { name: "Channel - ID", value: `${automodAction.channel} - (${automodAction.channelId})`, inline: false },
            { name: "Content", value: `${automodAction.content}`, inline: true },
            { name: "Matched Content", value: `${automodAction.matchedContent}`, inline: true },
            { name: "Matched Keyword", value: `${automodAction.matchedKeyword}`, inline: true },
            { name: "Triggered By", value: `${automodAction.member} (${automodAction.member.id})`, inline: false },
            { name: "Message ID", value: `${automodAction.messageId}`, inline: true },
            { name: "Rule ID", value: `${automodAction.ruleId}`, inline: true },
            { name: "Rule Trigger Type", value: `${automodAction.ruleTriggerType}`, inline: true },
            { name: "User", value: `${automodAction.user} (${automodAction.userId})`, inline: false },
            { name: "Risk", value: msgConfig.raidRisk }
        ];

        automodRule.actions.forEach((action, index) => {
            fields.splice(3, 0, { name: `Action Type ${index + 1}`, value: `${action.type}`, inline: true });
        });

        const embed = new EmbedBuilder()
            .setColor("Purple")
            .setTitle(title)
            .addFields(fields)

        return sendLog(embed, true, automodAction.channelId, title);
    })

    /**
     * Emitted whenever an auto moderation rule is created. This event requires the PermissionFlagsBits permission.
     * @param {AutoModerationRule} automodRule
     */
    client.on(Events.AutoModerationRuleCreate, (automodRule) => {
        let actTypes = automodRule.actions.map(action => {
            switch (action.type) {
                case 1: return "Block Message";
                case 2: return "Send Alert Message";
                case 3: return "Member Timeout";
                default: return "Unknown Action";
            }
        }).join(", ");

        evType = automodRule.eventType;
        if (evType == 1) evType = "Message Send";
        if (evType == 2) evType = "Member Update";

        const fields = [
            { name: "Rule Name - ID", value: `${automodRule.name} - ${automodRule.id}`, inline: false },
            { name: "Created By", value: `<@${automodRule.creatorId}> (${automodRule.creatorId})`, inline: false },
            { name: "Enabled?", value: `\`${automodRule.enabled}\``, inline: false },
            { name: "Event Type", value: `${evType}`, inline: false },
            { name: "Keyword Filter", value: `${automodRule.triggerMetadata.keywordFilter}` || "None", inline: false },
            { name: "Mention Raid Protection?", value: `\`${automodRule.triggerMetadata.mentionRaidProtectionEnabled}\``, inline: false },
            { name: "Risk", value: msgConfig.lowRisk }
        ];

        if (automodRule.triggerMetadata.mentionTotalLimit !== null) {
            fields.splice(7, 0, { name: "Total Mention Limit", value: `${automodRule.triggerMetadata.mentionTotalLimit}`, inline: false });
        }

        fields.splice(3, 0, { name: "Action Type", value: `${actTypes}`, inline: false });

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("\`🟢\` New AutoMod Rule Created")
            .addFields(fields);

        return sendLog(embed);
    })

    /**
     * Emitted whenever an auto moderation rule is deleted. This event requires the PermissionFlagsBits permission.
     * @param {AutoModerationRule} automodRule
     */
    client.on(Events.AutoModerationRuleDelete, (automodRule) => {
        let actTypes = automodRule.actions.map(action => {
            switch (action.type) {
                case 1: return "Block Message";
                case 2: return "Send Alert Message";
                case 3: return "Member Timeout";
                default: return "Unknown Action";
            }
        }).join(", ");

        evType = automodRule.eventType;
        if (evType == 1) evType = "Message Send";
        if (evType == 2) evType = "Member Update";

        const fields = [
            { name: "Rule Name - ID", value: `${automodRule.name} ${automodRule.id}`, inline: false },
            { name: "Created By", value: `<@${automodRule.creatorId}> (${automodRule.creatorId})`, inline: false },
            { name: "Enabled?", value: `\`${automodRule.enabled}\``, inline: false },
            { name: "Event Type", value: `${evType}`, inline: false },
            { name: "Keyword Filter", value: `${automodRule.triggerMetadata.keywordFilter}` || "None", inline: false },
            { name: "Mention Raid Protection?", value: `\`${automodRule.triggerMetadata.mentionRaidProtectionEnabled}\``, inline: false },
            { name: "Risk", value: msgConfig.highRisk }
        ];

        if (automodRule.triggerMetadata.mentionTotalLimit !== null) {
            fields.push({ name: "Total Mention Limit", value: `${automodRule.triggerMetadata.mentionTotalLimit}`, inline: false });
        }

        fields.splice(3, 0, { name: "Action Type", value: `${actTypes}`, inline: false });

        const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("\`🔴\` AutoMod Rule Deleted")
            .addFields(fields);

        return sendLog(embed)
    })

    /**
     * Emitted whenever an auto moderation rule gets updated. This event requires the PermissionFlagsBits permission.
     * @param {AutoModerationRule} oldAutoModRule
     * @param {AutoModerationRule} newAutoModRule
     * On discord.js v 14.16.3 the event is not working properly, oldAutoModRule seems to be always null
     */
    client.on(Events.AutoModerationRuleUpdate, async (oldAutoModRule, newAutoModRule) => {
        if (!oldAutoModRule)
            return sendLog("apiError", "autoModerationRuleUpdate");

        const differences = await getDifferences(oldAutoModRule, newAutoModRule);

        const embed = new EmbedBuilder()
            .setTitle(`\`🟡\` Automod Rule Modified`)
            .setDescription("The following changes have been made to automod rule:")
            .setColor("Yellow")
            .addFields({ name: "Rule Name - ID", value: `${oldAutoModRule.name} - ${oldAutoModRule.id}`, inline: true })
        for (const key in differences) {
            const { oldValue, newValue } = differences[key];
            embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
        }

        embed.addFields({ name: "Risk", value: msgConfig.moderateRisk, inline: false });
        return sendLog(embed);
    })

    /**
     * Cache Sweep
     * @param {String} message
     */
    // client.on(Events.CacheSweep, (message) => {
    //     const embed = new EmbedBuilder()
    //         .setColor("Yellow")
    //         .setTitle("\`🟡\` Cache Sweeped")

    //     // return sendLog(embed);
    // })

    /**
     * Emitted whenever a guild channel is created.
     * @param {GuildChannel} channel
     */
    client.on(Events.ChannelCreate, async (channel) => {
        channel.guild
            .fetchAuditLogs({ type: AuditLogEvent.ChannelCreate })
            .then(async (audit) => {
                const { executor } = audit.entries.first();
                let type = channel.type;

                if (type == 0) type = "Text";
                if (type == 2) type = "Voice";
                if (type == 13) type = "Stage";
                if (type == 15) type = "Form";
                if (type == 5) type = "Announcement";
                if (type == 4) type = "Category";

                const embed = new EmbedBuilder()
                    .setTitle("\`🟢\` Channel Created")
                    .setColor("Green")
                    .addFields({ name: "Channel - Channel ID", value: `${channel} - ${channel.id}`, inline: false })
                    .addFields({ name: "Channel Type", value: `${type}`, inline: true })
                    .addFields({ name: "Created By", value: `<@${executor.id}> (${executor.tag})`, inline: true })
                    .addFields({ name: "Parent Category ID", value: `${channel.parentId}`, inline: false })
                    .addFields({ name: "NSFW?", value: `\`${channel.nsfw}\``, inline: true })
                    .addFields({ name: "Rate Limit Per User", value: `${channel.rateLimitPerUser}`, inline: false })
                    .addFields({ name: "Risk", value: msgConfig.lowRisk })

                return sendLog(embed);
            })
    });

    /**
     * Emitted whenever a channel is deleted.
     * @param {DMChannel | GuildChannel} channel
     * Deleted by field should be always correct.
     */
    client.on(Events.ChannelDelete, async (channel) => {
        channel.guild
            .fetchAuditLogs({ type: AuditLogEvent.ChannelDelete })
            .then(async (audit) => {
                const { executor } = audit.entries.first();
                let type = channel.type;

                if (type == 0) type = "Text";
                if (type == 2) type = "Voice";
                if (type == 13) type = "Stage";
                if (type == 15) type = "Form";
                if (type == 5) type = "Announcement";
                if (type == 4) type = "Category";

                const embed = new EmbedBuilder()
                    .setTitle("\`🟡\` Channel Deleted")
                    .setColor("Yellow")
                    .addFields({ name: "Channel - Channel ID", value: `${channel} - ${channel.id}`, inline: false })
                    .addFields({ name: "Channel Type", value: `${type}`, inline: true })
                    .addFields({ name: "Deleted By", value: `<@${executor.id}> (${executor.tag})`, inline: false })
                    .addFields({ name: "Risk", value: msgConfig.moderateRisk })

                return sendLog(embed);
            });
    });

    /**
     * Emitted whenever the pins of a channel are updated. Due to the nature of the WebSocket event, 
     * not much information can be provided easily here - you need to manually check the pins yourself.
     * @param {TextBasedChannels} channel
     * @param {Date} date
     */
    client.on(Events.ChannelPinsUpdate, (channel, date) => {
        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`\`🟢\` New Pinned Message`)
            .addFields({ name: "Channel - Channel ID", value: `${channel} - (${channel.id})`, inline: true })
            .addFields({ name: "Risk", value: msgConfig.lowRisk })

        return sendLog(embed);
    })

    // Emitted whenever a channel is updated - e.g. name change, topic change, channel type change.
    /**
     * @param {DMChannel | GuildChannel} oldChannel
     * @param {DMChannel | GuildChannel} newChannel
     */
    client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
        // Check if channel is under server stats category (we don't want these channels be logged when modified)
        if (serverStatsCategoryId && newChannel.parent?.id === serverStatsCategoryId) return;

        newChannel.guild
            .fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate })
            .then(async (audit) => {
                const { executor } = audit.entries.first();
                if (!executor || !oldChannel || !newChannel) return;

                const differences = await getDifferences(oldChannel, newChannel);
                const permissionDifferences = await getPermissionDifferences(
                    oldChannel.permissionOverwrites.cache.map(overwrite => overwrite),
                    newChannel.permissionOverwrites.cache.map(overwrite => overwrite)
                );

                const embed = new EmbedBuilder()
                    .setTitle(`\`🟡\` Channel Modified`)
                    .setDescription("The following changes have been made to the channel:")
                    .setColor("Yellow")
                    .addFields({ name: "Channel ID - Name", value: `${oldChannel.id} - ${oldChannel.name}`, inline: false });

                for (const key in differences) {
                    const { oldValue, newValue } = differences[key];
                    embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
                }

                for (const permDiff of permissionDifferences) {
                    const targetType = permDiff.type === 0 ? 'Role' : 'User';
                    const targetMention = permDiff.type === 0 ? `<@&${permDiff.id}>` : `<@${permDiff.id}>`;

                    if (permDiff.change === 'added') {
                        embed.addFields({ name: `Permission Added`, value: `${targetType}: ${targetMention}\nAllow: ${formatPermissions(permDiff.allow.bitfield)}\nDeny: ${formatPermissions(permDiff.deny.bitfield)}`, inline: false });
                    } else if (permDiff.change === 'updated') {
                        for (const key in permDiff.differences) {
                            const { oldValue, newValue } = permDiff.differences[key];
                            embed.addFields({ name: `Permission Updated`, value: `${targetType}: ${targetMention}\n${key} Before: ${oldValue}\n${key} After: ${newValue}`, inline: false });
                        }
                    } else if (permDiff.change === 'removed') {
                        embed.addFields({ name: `Permission Removed`, value: `${targetType}: ${targetMention}\nAllow: ${formatPermissions(permDiff.allow.bitfield)}\nDeny: ${formatPermissions(permDiff.deny.bitfield)}`, inline: false });
                    }
                }

                embed.addFields({ name: "Modified by", value: `<@${executor.id}> (${executor.tag})`, inline: false });
                embed.addFields({ name: "Risk", value: msgConfig.moderateRisk, inline: false });
                return sendLog(embed);
            })
    })

    /**
     * Emitted when the client becomes ready to start working.
     * @param {Client} client
     */
    // client.on(Events.ClientReady, async (client) => {
    //     const embed = new EmbedBuilder()
    //         .setColor("Green")
    //         .setTitle("\`🟢\` Client is ready to start working")
    //         .addFields({ name: "Risk", value: msgConfig.info })

    //     return sendLog(embed);
    // })

    /**
     * Emitted for general debugging information.
     * @param {String} debug
     */
    // client.on(Events.Debug, async (debug) => {
    //     const embed = new EmbedBuilder()
    //         .setColor("Blue")
    //         .setTitle("🔵 DEBUG")
    //         .addFields({ name: "Text", value: debug, inline: false })
    //         .addFields({ name: "Risk", value: msgConfig.info, inline: false })

    //     return sendLog(embed);
    // })

    /**
     * Emitted when the client encounters an error. Errors thrown within this event do not have a catch handler,
     * it is recommended to not use async functions as error event handlers. See the 
     * [Node.js docs](https://nodejs.org/api/events.html#capture-rejections-of-promises) for details.
     * @param {Error} error
     */
    client.on(Events.Error, async (error) => {
        console.log(error);

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("🔵 ERROR")
            .addFields({ name: "Error Name", value: error.name, inline: false })
            .addFields({ name: "Error Message", value: error.message, inline: false })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a guild audit log entry is created.
     * @param {GuildAuditLogsEntry} auditLogEntry
     * @param {Guild} guild
     * This event seems to be not invoked properly on discord.js v14.16.3
     */
    client.on(Events.GuildAuditLogEntryCreate, async (auditLogEntry, guild) => {
        if (!auditLogEntry) return;

        const { action, executorId, targetId } = auditLogEntry;

        switch (action) {
            case AuditLogEvent.MemberKick: {
                const reason = auditLogEntry.reason || "None";

                const executor = await client.users.fetch(executorId);

                const kickedUser = await client.users.fetch(targetId);

                const embed = new EmbedBuilder()
                    .setColor("Yellow")
                    .setTitle("\`🟡\` Member Kicked")
                    .addFields({ name: "Member - Member Username", value: `${kickedUser} - ${kickedUser.username}`, inline: false })
                    .addFields({ name: "Member ID", value: `${kickedUser.id}`, inline: true })
                    .addFields({ name: "Kicked By", value: executor.username, inline: false })
                    .addFields({ name: "Reason", value: reason || "None", inline: false })
                    .addFields({ name: "Risk", value: msgConfig.moderateRisk });

                await sendLog(embed);

                const config = await BotConfig.findOne({ GuildID: guild.id });
                const serviceConfig = config?.services?.greeting;

                if (!serviceConfig || !serviceConfig.enabled || serviceConfig.Goodbye.Enabled !== true) return;

                try {
                    const kickEntry = {
                        UserID: kickedUser.id,
                        KickedBy: executor.id,
                        Reason: reason,
                        KickedAt: new Date(),
                    };

                    if (!config.services.kick)
                        config.services.kick = { Kicks: [] };

                    config.services.kick.Kicks.push(kickEntry);
                    await updateServiceConfig(config, "kick", { Kicks: config.services.kick.Kicks });
                } catch (error) {
                    console.log("[handleLogs.js] Error while adding kick to DB: ", error);
                }

                try {
                    const channel = guild.channels.cache.get(serviceConfig.Goodbye.ChannelID);
                    if (!channel) return;

                    const reasonLine = "Kick";
                    const message = serviceConfig.Goodbye.Message.replace("<user>", kickedUser.username);

                    const replyMessage = serviceConfig.Goodbye.ReplyMessage
                        ? serviceConfig.Goodbye.ReplyMessage
                            .replace("<user>", kickedUser.username)
                            .replace("<reason>", reasonLine)
                        : "";

                    let borderColor = serviceConfig.Goodbye.BorderColor || "#FFFFFF";
                    if (borderColor.toLowerCase() === "random") borderColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

                    const image = await profileImage(kickedUser.id, {
                        presenceStatus: serviceConfig.Goodbye.PresenceStatus || "online",
                        borderColor: borderColor,
                        customTag: message || "Bye! <user>",
                        customDate: new Date().toLocaleDateString(),
                        customBackground: kickedUser.bannerURL?.({ forceStatic: true })
                    });

                    await channel.send({ content: `${replyMessage}\n${reasonLine}`, files: [image] });
                } catch (error) {
                    console.log("[handleLogs.js] Error while sending goodbye message for kick: ", error);
                }

                break;
            }
            default:
                return;
        }

        let changed;
        if (auditLogEntry.changes.old != auditLogEntry.changes.new)
            changed = true;
        else
            changed = false;

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("\`🔵\` Audit Log Entry Created")
            .addFields({ name: "Action", value: auditLogEntry.action, inline: true })
            .addFields({ name: "Action Type", value: auditLogEntry.actionType, inline: true })
            .addFields({ name: "Does Entry Already Exist?", value: `\`${changed}\``, inline: false })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a guild becomes available.
     * @param {Guild} guild
     */
    // client.on(Events.GuildAvailable, async(guild) => {
    //     const embed = new EmbedBuilder()
    //         .setColor("Blue")
    //         .setTitle("\`🔵\` Guild is now available")
    //         .addFields({ name: "Guild Name", value: `${guild.name} (${guild.id})`, inline: false })
    //         .addFields({ name: "Risk", value: msgConfig.info, inline: false })

    //     return sendLog(embed);
    // })

    /**
     * Emitted whenever a member is banned from a guild.
     * @param {GuildBan} guildBan
     */
    client.on(Events.GuildBanAdd, async (guildBan) => {
        const audit = await guildBan.guild.fetchAuditLogs({ type: AuditLogEvent.GuildBanAdd, limit: 5 }).catch(() => null);
        let bannedBy = "Unknown", reason = "None";

        let auditEntry = null;
        if (audit) {
            auditEntry = audit.entries.find(entry =>
                entry.target.id === guildBan.user.id &&
                Date.now() - entry.createdTimestamp < 10000
            );
        }

        if (auditEntry) {
            bannedBy = `<@${auditEntry.executor.id}> (${auditEntry.executor.tag})`;
            reason = auditEntry.reason || "No reason";
        }

        const BotConfig = require("../schemas/BotConfig");
        const config = await BotConfig.findOne({ GuildID: guildBan.guild.id });

        if (config && config.services?.ban) {
            // Check in the DB if there is an unban for this user, if so we remove it before banning
            if (config?.services?.unban?.Unbans) {
                config.services.unban.Unbans = config.services.unban.Unbans.filter(u => u.UserID !== guildBan.user.id);
                await updateServiceConfig(config, "unban", { Unbans: config.services.unban.Unbans });
            }

            // Find the ban entry in the database, if it exists get the BannedBy field
            const banDbEntry = config.services.ban.Bans?.find(b => b.UserID === guildBan.user.id);

            if (banDbEntry && banDbEntry.Reason)
                reason = banDbEntry.Reason;
            if (banDbEntry && banDbEntry.BannedBy && banDbEntry.BannedBy !== "Unknown")
                bannedBy = `<@${banDbEntry.BannedBy}>`;

            // If it doesn't exist, add the ban as manual/external
            if (!banDbEntry) {
                const banEntry = {
                    UserID: guildBan.user.id,
                    BannedBy: auditEntry?.executor?.id || "Unknown",
                    Reason: reason,
                    BannedAt: new Date()
                };

                config.services.ban.Bans = config.services.ban.Bans || [];
                config.services.ban.Bans.push(banEntry);
                await updateServiceConfig(config, "ban", { Bans: config.services.ban.Bans });
            }
        }

        const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("\`🔴\` Member Banned")
            .addFields({ name: "Member - Member Username", value: `${guildBan.user} - ${guildBan.user.username}`, inline: false })
            .addFields({ name: "Member ID", value: `${guildBan.user.id}`, inline: true })
            .addFields({ name: "Banned By", value: bannedBy, inline: false })
            .addFields({ name: "Reason", value: reason || "None", inline: false })
            .addFields({ name: "Risk", value: msgConfig.highRisk });

        await sendLog(embed);

        try {
            const config = await BotConfig.findOne({ GuildID: guildBan.guild.id });
            const serviceConfig = config?.services?.greeting;

            if (!serviceConfig || !serviceConfig.enabled || serviceConfig.Goodbye.Enabled !== true) return;

            const channel = guildBan.guild.channels.cache.get(serviceConfig.Goodbye.ChannelID);
            if (!channel) return;

            const reasonLine = "Ban";
            const message = serviceConfig.Goodbye.Message.replace("<user>", guildBan.user.username);

            const replyMessage = serviceConfig.Goodbye.ReplyMessage
                ? serviceConfig.Goodbye.ReplyMessage
                    .replace("<user>", guildBan.user.username)
                    .replace("<reason>", reasonLine)
                : "";

            let borderColor = serviceConfig.Goodbye.BorderColor || "#FFFFFF";
            if (borderColor.toLowerCase() === "random") borderColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

            const image = await profileImage(guildBan.user.id, {
                presenceStatus: serviceConfig.Goodbye.PresenceStatus || "online",
                borderColor: borderColor,
                customTag: message || "Bye! <user>",
                customDate: new Date().toLocaleDateString(),
                customBackground: guildBan.user.bannerURL?.({ forceStatic: true })
            });

            await channel.send({ content: `${replyMessage}\n${reasonLine}`, files: [image] });
        } catch (error) {
            console.log("[handleLogs.js] Error while sending goodbye message for ban: ", error);
        }
    });

    /**
     * Emitted whenever a member is unbanned from a guild.
     * @param {GuildBan} guildBan
     */
    client.on(Events.GuildBanRemove, async (guildBan) => {
        guildBan.guild
            .fetchAuditLogs({ type: AuditLogEvent.GuildBanRemove })
            .then(async (audit) => {
                const BotConfig = require("../schemas/BotConfig");
                const config = await BotConfig.findOne({ GuildID: guildBan.guild.id });
                let unbannedBy = "Unknown", reason = "None";

                if (config && config.services?.unban) {
                    if (config?.services?.ban?.Bans) {
                        config.services.ban.Bans = config.services.ban.Bans.filter(b => b.UserID !== guildBan.user.id);
                        await updateServiceConfig(config, "ban", { Bans: config.services.ban.Bans });
                    }

                    const unbanDbEntry = config.services.unban.Unbans?.find(u => u.UserID === guildBan.user.id);

                    if (unbanDbEntry && unbanDbEntry.Reason)
                        reason = unbanDbEntry.Reason;
                    else
                        reason = guildBan.reason || "No reason";

                    if (unbanDbEntry && unbanDbEntry.UnbannedBy && unbanDbEntry.UnbannedBy !== "Unknown") unbannedBy = `<@${unbanDbEntry.UnbannedBy}>`;

                    if (!unbanDbEntry) {
                        const unbanEntry = {
                            UserID: guildBan.user.id,
                            UnbannedBy: "Unknown",
                            Reason: guildBan.reason || "No reason",
                            UnbannedAt: new Date()
                        };

                        config.services.unban.Unbans = config.services.unban.Unbans || [];
                        config.services.unban.Unbans.push(unbanEntry);
                        await updateServiceConfig(config, "unban", { Unbans: config.services.unban.Unbans });
                    }
                }

                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setTitle("\`🔴\` Member Unbanned")
                    .addFields({ name: "Member - Member Username", value: `${guildBan.user} - ${guildBan.user.username}`, inline: false })
                    .addFields({ name: "Member ID", value: `${guildBan.user.id}`, inline: true })
                    .addFields({ name: "Unbanned By", value: unbannedBy, inline: false })
                    .addFields({ name: "Reason", value: reason || "None", inline: false })
                    .addFields({ name: "Risk", value: msgConfig.highRisk });

                return sendLog(embed);
            });
    });

    /**
     * Emitted whenever the client joins a guild.
     * @param {Guild} guild
     */
    client.on(Events.GuildCreate, async (guild) => {
        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("\`🔵\` Client has joined a Guild")
            .addFields({ name: "Guild Name - ID", value: `${guild.name} - (${guild.id})`, inline: false })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    });

    /**
     * Emitted whenever a guild kicks the client or the guild is deleted/left.
     * @param {Guild} guild
     */
    client.on(Events.GuildDelete, async (guild) => {
        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("\`🔵\` Client has been kicked from a Guild")
            .addFields({ name: "Guild Name/ID", value: `${guild.name} (${guild.id})`, inline: false })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    });

    /**
     * Emitted whenever a new emoji is created from a guild.
     * @param {GuildEmoji} emoji
     */
    client.on(Events.GuildEmojiCreate, async (createdEmoji) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        const formattedCreatedAt = createdEmoji.createdAt.toLocaleString('en-US', options);

        const author = await createdEmoji.fetchAuthor();

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`\`🔵\` Server Emoji Created`)
            .addFields({ name: "Emoji Name - ID", value: `${createdEmoji.name} - ${createdEmoji.id}`, inline: false })
            .addFields({ name: "Animated?", value: `\`${createdEmoji.animated}\``, inline: false })
            .addFields({ name: "Available?", value: `\`${createdEmoji.available}\``, inline: true })
            .addFields({ name: "Author", value: `<@${author.id}> (${author.id})` || `\`Unknown\``, inline: true })
            .addFields({ name: "Client", value: (`<@${createdEmoji.client.user.id}> (${createdEmoji.client.user.id})`) || `\`Unknown\``, inline: true })
            .addFields({ name: "Created At", value: formattedCreatedAt, inline: false })
            .addFields({ name: "Deletable?", value: `\`${createdEmoji.deletable}\``, inline: true })
            .addFields({ name: "Managed by Ext. Service?", value: `\`${createdEmoji.managed}\``, inline: true })
            .addFields({ name: "Emoji's Guild - Guild ID", value: `${createdEmoji.guild} - (${createdEmoji.guild.id})`, inline: false })
            .addFields({ name: "Emoji URL", value: createdEmoji.imageURL(), inline: true })
            .addFields({ name: "Emoji Preview", value: createdEmoji.toString(), inline: true })
            .addFields({ name: "Risk", value: msgConfig.info })

        return sendLog(embed);
    });

    /**
     * Emitted whenever a custom emoji is deleted from a guild.
     * @param {GuildEmoji} emoji
     */
    client.on(Events.GuildEmojiDelete, async (deletedEmoji) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        const formattedCreatedAt = deletedEmoji.createdAt.toLocaleString('en-US', options);

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`\`🔵\` Server Emoji Deleted`)
            .addFields({ name: "Emoji Name - ID", value: `${deletedEmoji.name} - ${deletedEmoji.id}`, inline: false })
            .addFields({ name: "Client", value: (`<@${deletedEmoji.client.user.id}> (${deletedEmoji.client.user.id})`) || `\`Unknown\``, inline: false })
            .addFields({ name: "Created At", value: formattedCreatedAt, inline: false })
            .addFields({ name: "Emoji's Guild ID", value: `${deletedEmoji.guild} - (${deletedEmoji.guild.id})`, inline: false })
            .addFields({ name: "Emoji URL", value: deletedEmoji.imageURL(), inline: true })
            .addFields({ name: "Risk", value: msgConfig.info })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a existing emoji is modified from a guild.
     * @param {GuildEmoji} oldEmoji
     * @param {GuildEmoji} newEmoji
     */
    client.on(Events.GuildEmojiUpdate, async (oldEmoji, newEmoji) => {
        const differences = await getDifferences(oldEmoji, newEmoji);

        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Serer Emoji modified`)
            .setDescription("The following changes have been made to emoji:")
            .setColor("Blue")
            .addFields({ name: "Emoji Name - ID", value: `${newEmoji.name} - ${newEmoji.id}`, inline: true })

        for (const key in differences) {
            const { oldValue, newValue } = differences[key];
            if (key != "_roles") // Won't log useless changes
                embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
        }

        embed.addFields({ name: "Risk", value: msgConfig.info, inline: false })
        return sendLog(embed);
    })

    /**
     * Emitted whenever guild integrations are updated.
     * @param {Guild} guild
     */
    client.on(Events.GuildIntegrationsUpdate, async (guild) => {
        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`\`🔵\` Guild Integrations have been updated`)
            .addFields({ name: "Guild Name - ID", value: `${guild.name} - ${guild.id}`, inline: false })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a user joins a guild.
     * @param {GuildMember} member
     * Plus: Alert system for recently created accounts and users that have re-entered the server more than a certain limit
     */
    client.on(Events.GuildMemberAdd, async (member) => {
        const staffChannel = client.channels.cache.get(`${msgConfig.staffChannel}`);
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        const formattedCreatedAt = member.user.createdAt.toLocaleString('en-US', options);
        const formattedJoinedAt = member.joinedAt.toLocaleString('en-US', options);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`\`🔵\` Member **Joined** the Server`)
            .setThumbnail(member.displayAvatarURL())
            .addFields({ name: "Member - Member Userame", value: `${member} - ${member.user.username}`, inline: false })
            .addFields({ name: "Member ID", value: member.id, inline: true })
            .addFields({ name: "Created At", value: formattedCreatedAt, inline: true })
            .addFields({ name: "Joined At", value: formattedJoinedAt, inline: true })
            .addFields({ name: "Official Discord System User?", value: `\`${member.user.system}\``, inline: true })
            .addFields({ name: "Kickable?", value: `\`${member.kickable}\``, inline: true })
            .addFields({ name: "Manageable?", value: `\`${member.manageable}\``, inline: true })
            .addFields({ name: "Moderatable?", value: `\`${member.moderatable}\``, inline: true })
            .addFields({ name: "Bot?", value: `\`${member.user.bot}\``, inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false });

        await sendLog(embed);

        if (member.user.createdAt > oneMonthAgo) {
            const kickBtn = new ButtonBuilder()
                .setCustomId("kick-sus-user")
                .setLabel("🦶 Kick User")
                .setStyle(ButtonStyle.Danger)

            const banBtn = new ButtonBuilder()
                .setCustomId("ban-sus-user")
                .setLabel("⛔ Ban User")
                .setStyle(ButtonStyle.Danger)

            const cancelBtn = new ButtonBuilder()
                .setCustomId("noaction-sus-user")
                .setLabel("🔰 Do Nothing")
                .setStyle(ButtonStyle.Secondary)

            const row = new ActionRowBuilder().addComponents(kickBtn, banBtn, cancelBtn);

            const config = await BotConfig.findOne({ GuildID: member.guild.id });
            const suspiciousUsers = config.services?.suspicioususerjoin || [];

            let result = suspiciousUsers.find(u => u.SusUserID === member.id);
            if (result) return await staffChannel.send({ content: `@here User ${member} (${member.id}) left and rejoined the server multiple times!` });

            if (staffChannel) {
                let msg = await staffChannel.send({ content: `@here ⚠️ **Alert!** ${member}'s (${member.id}) account was created less than a month ago.`, embeds: [embed], components: [row] });

                const date = new Date();
                const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} - ${date.getHours()}:${date.getMinutes()}`;

                suspiciousUsers.push({
                    GuildID: member.guild.id,
                    SusUserID: member.id,
                    MessageID: `${msg.id}`,
                    JoinDate: formattedDate,
                    TakenAction: false,
                });

                await updateServiceConfig(config, "suspicioususerjoin", suspiciousUsers);
                return;
            } else {
                console.error("logChannel not found! check your Bot Config!");
            }
        }
    })

    /**
     * Emitted whenever a member becomes available.
     * @param {GuildMember} member
     */
    // client.on(Events.GuildMemberAvailable, async (member) => {
    //     const embed = new EmbedBuilder()
    //         .setColor("Blue")
    //         .setTitle(`\`🔵 Member is now Available\``)
    //         .setThumbnail(member.displayAvatarURL())
    //         .addFields({ name: "Name", value: `${member} (${member.user.username})`, inline: true })
    //         .addFields({ name: "ID", value: member.id, inline: true })
    //         .addFields({ name: "Risk", value: msgConfig.info, inline: false })

    //     return sendLog(embed);
    // })

    /**
     * Emitted whenever a member leaves a guild, or is kicked.
     * @param {GuildMember} member
     */
    client.on(Events.GuildMemberRemove, async (member) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
        const formattedCreatedAt = member.user.createdAt.toLocaleString('en-US', options);
        const formattedJoinedAt = member.joinedAt.toLocaleString('en-US', options);

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle("`🔵` Member has left the server")
            .setThumbnail(member.displayAvatarURL())
            .addFields({ name: "Member - Member Username", value: `${member} - ${member.user.username}`, inline: false })
            .addFields({ name: "Member ID", value: member.id, inline: true })
            .addFields({ name: "Bot?", value: `\`${member.user.bot}\``, inline: true })
            .addFields({ name: "Created At", value: formattedCreatedAt, inline: true })
            .addFields({ name: "Joined At", value: formattedJoinedAt, inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false });

        await sendLog(embed);

        try {
            const config = await BotConfig.findOne({ GuildID: member.guild.id });
            const serviceConfig = config?.services?.greeting;

            if (!serviceConfig || !serviceConfig.enabled || serviceConfig.Goodbye.Enabled !== true) return;

            const channel = member.guild.channels.cache.get(serviceConfig.Goodbye.ChannelID);
            if (!channel) return;

            let reasonLine = "Left";
            const message = serviceConfig.Goodbye.Message.replace("<user>", member.user.username);

            const replyMessage = serviceConfig.Goodbye.ReplyMessage
                ? serviceConfig.Goodbye.ReplyMessage
                    .replace("<user>", member.user.username)
                    .replace("<reason>", reasonLine)
                : "";

            let borderColor = serviceConfig.Goodbye.BorderColor || "#FFFFFF";
            if (borderColor.toLowerCase() === "random") borderColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

            const image = await profileImage(member.user.id, {
                presenceStatus: serviceConfig.Goodbye.PresenceStatus || "online",
                borderColor: borderColor,
                customTag: message || "Bye! <user>",
                customDate: new Date().toLocaleDateString(),
                customBackground: member.user.bannerURL({ forceStatic: true })
            });

            await channel.send({ content: `${replyMessage}`, files: [image] });
        } catch (error) {
            console.log("[handleLogs.js] Error while sending goodbye message: ", error);
        }
    });

    /**
     * Emitted whenever a chunk of guild members is received (all members come from the same guild).
     * @param {Collection<Snowflake, GuildMember>} members
     * @param {Guild} guild
     * @param {GuildMembersChunk} chunk
     */
    client.on(Events.GuildMembersChunk, async (members, guild, chunk) => {
        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`\`🔵\` Guild Members Chunk Received`)
            .addFields({ name: "Guild Name - ID", value: `${guild.name} - ${guild.id}`, inline: true })
            .addFields({ name: "Members Collection Size", value: `${members.size}`, inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    });

    /**
     * Emitted whenever a guild member changes - i.e. new role, removed role, nickname.
     * @param {GuildMember} oldMember
     * @param {GuildMember} newMember
     */
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
        const embed = new EmbedBuilder()
            .setColor("Yellow")
            .setThumbnail(oldMember.displayAvatarURL());

        const differences = await getDifferences(oldMember, newMember);

        // getDifferences() doesn't check roles, so we need to check them separately
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        const rolesAdded = newRoles.filter(role => !oldRoles.has(role.id));
        const rolesRemoved = oldRoles.filter(role => !newRoles.has(role.id));

        embed.addFields({ name: "Guild Member - Guild Member ID", value: `${newMember} - ${newMember.id}`, inline: true });

        if (rolesAdded.size > 0 || rolesRemoved.size > 0) {
            embed.setTitle(`\`🟡\` Member Roles have been Changed`);

            const auditLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate });
            const auditEntry = auditLogs.entries.first();
            const executor = auditEntry ? auditEntry.executor : null;

            if (rolesAdded.size > 0) {
                embed.addFields({ name: "Roles Added", value: rolesAdded.map(role => `${role} (ID: ${role.id})`).join(', '), inline: false });
            }

            if (rolesRemoved.size > 0) {
                embed.addFields({ name: "Roles Removed", value: rolesRemoved.map(role => `${role} (ID: ${role.id})`).join(', '), inline: false });
            }

            if (executor) {
                embed.addFields({ name: "Roles Modified By", value: `${executor} (${executor.id})`, inline: false });
            }

            embed.addFields({ name: "Risk", value: msgConfig.moderateRisk, inline: false });
        }
        else
            embed.setTitle(`\`🟡\` Member has been modified`);

        // Differences detected by getDifferences() here:
        for (const key in differences) {
            const { oldValue, newValue } = differences[key];
            embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
        }

        return sendLog(embed);
    })

    /**
     * Emitted when guild role is created
     * @param {Role} role
     */
    client.on(Events.GuildRoleCreate, async (role) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        const formattedCreatedAt = role.createdAt.toLocaleString('en-US', options);

        let permissions = 'No permissions';

        if (role.permissions.toArray().length > 0) {
            permissions = formatPermissions(role.permissions.bitfield);
        }

        const colorHex = `#${role.color.toString(16).padStart(6, '0')}`;
        const colorName = await getColorName(colorHex);

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle(`\`🟢\` Role Created`)
            .addFields({ name: "Role - Role Name - Role ID", value: `${role} - ${role.name} - ${role.id}`, inline: false })
            .addFields({ name: "Color", value: `${colorName} (${colorHex})`, inline: false })
            .addFields({ name: "Icon", value: role.icon || "None", inline: true })
            .addFields({ name: "Unicode Emoji", value: role.unicodeEmoji || "None", inline: true })
            .addFields({ name: "Created At", value: formattedCreatedAt, inline: false })
            .addFields({ name: "Separate from others?", value: `\`${role.hoist}\``, inline: true })
            .addFields({ name: "Editable?", value: `\`${role.editable}\``, inline: true })
            .addFields({ name: "Managed?", value: `\`${role.managed}\``, inline: false })
            .addFields({ name: "Mentionable?", value: `\`${role.mentionable}\``, inline: true })
            .addFields({ name: "Role Position", value: role.position.toString(), inline: true })
            .addFields({ name: "Role Raw Position", value: role.rawPosition.toString(), inline: false })
            .addFields({ name: "Role Permissions", value: permissions, inline: true })
            .addFields({ name: "Risk", value: msgConfig.lowRisk, inline: false });

        return sendLog(embed);
    })

    /**
     * Emitted when guild role is deleted
     * @param {Role} role
     */
    client.on(Events.GuildRoleDelete, async (role) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        const formattedCreatedAt = role.createdAt.toLocaleString('en-US', options);

        let permissions = 'No permissions';

        if (role.permissions.toArray().length > 0) {
            permissions = role.permissions.toArray().map(permission => `\`${permission}\``).join(', ');
        }

        const embed = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle(`\`🟡\` Role Deleted`)
            .addFields({ name: "Role - Role Name - Role ID", value: `${role} - ${role.name} - ${role.id}`, inline: false })
            .addFields({ name: "Created At", value: formattedCreatedAt, inline: false })
            .addFields({ name: "Separate from others?", value: `\`${role.hoist}\``, inline: true })
            .addFields({ name: "Mentionable?", value: `\`${role.mentionable}\``, inline: true })
            .addFields({ name: "Role Permissions: ", value: permissions, inline: false })
            .addFields({ name: "Risk", value: msgConfig.moderateRisk, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted when guild role is updated 
     * @param {Role} oldRole
     * @param {Role} newRole
     */
    client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
        const differences = await getDifferences(oldRole, newRole);

        // getDifference() doesn't check permissions, so we need to check them separately
        const oldPermissions = oldRole.permissions;
        const newPermissions = newRole.permissions;

        const permissionsAdded = newPermissions.toArray().filter(perm => !oldPermissions.has(perm));
        const permissionsRemoved = oldPermissions.toArray().filter(perm => !newPermissions.has(perm));

        // Remove junk data from differences
        delete differences.tags;
        delete differences.rawPosition;

        // Check if the only difference is rawPosition and tags (which are not important)
        if (Object.keys(differences).length === 0 && permissionsAdded.length === 0 && permissionsRemoved.length === 0) {
            return; // It doesn't send the embed if there are no differences (othwerwise it would be empty)
        }

        const embed = new EmbedBuilder()
            .setTitle(`\`🟡\` Role Modified`)
            .setDescription("The following changes have been made to role:")
            .setColor("Yellow")
            .addFields({ name: "Role Name - ID", value: `${role.name} - ${role.id}`, inline: true })

        // Differences detected by getDifferences() here:
        for (const key in differences) {
            const { oldValue, newValue } = differences[key];
            if (key === 'color') {
                const oldColorHex = `#${oldValue.toString(16).padStart(6, '0')}`;
                const newColorHex = `#${newValue.toString(16).padStart(6, '0')}`;
                const oldColorName = await getColorName(oldColorHex);
                const newColorName = await getColorName(newColorHex);
                embed.addFields({ name: 'Color', value: `Before: ${oldColorName}\nAfter: ${newColorName}`, inline: false });
            } else {
                embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
            }
        }

        if (permissionsAdded.length > 0) {
            embed.addFields({ name: "Permissions Added", value: permissionsAdded.map(perm => `\`${perm}\``).join(', '), inline: false });
        }

        if (permissionsRemoved.length > 0) {
            embed.addFields({ name: "Permissions Removed", value: permissionsRemoved.map(perm => `\`${perm}\``).join(', '), inline: false });
        }

        embed.addFields({ name: "Risk", value: msgConfig.moderateRisk, inline: false });
        return sendLog(embed);
    })

    /**
     * Emitted whenever a guild scheduled event is created.
     * @param {GuildScheduledEvent} guildScheduledEvent
     */
    client.on(Events.GuildScheduledEventCreate, async (guildScheduledEvent) => {
        const event = guildScheduledEvent;

        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        const formattedCreatedAt = event.createdAt.toLocaleString('en-US', options);
        const formattedStartAt = event.scheduledStartAt.toLocaleString('en-US', options);
        const formattedEndAt = event.scheduledEndAt.toLocaleString('en-US', options);

        const embed = new EmbedBuilder()
        embed.setColor("Green")
            .setTitle("\`🟢\` Scheduled Event Created")
            .setThumbnail(event.coverImageURL())
            .addFields({ name: "Channel - Channel ID", value: `${event.channel} - ${event.channelId}`, inline: false })
            .addFields({ name: "Creator - Creator ID", value: `${event.creator} - ${event.creatorId}`, inline: false })
            .addFields({ name: "Created At", value: formattedCreatedAt, inline: true })
            .addFields({ name: "Location", value: event.entityMetadata.location.toString(), inline: true })
            .addFields({ name: "Event Name - ID", value: `${event.name} - ${event.id}`, inline: false })
            .addFields({ name: "Description", value: event.description || "None", inline: true })
            .addFields({ name: "Image", value: event.coverImageURL() || "None", inline: true })
            .addFields({ name: "Scheduled Start", value: formattedStartAt, inline: false })
            .addFields({ name: "Scheduled End", value: formattedEndAt, inline: true })
            .addFields({ name: "Status", value: `\`${event.status}\``, inline: true })
            .addFields({ name: "Event URL", value: event.url, inline: false })
            .addFields({ name: "Risk", value: msgConfig.lowRisk, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a guild scheduled event is deleted.
     * @param {GuildScheduledEvent} guildScheduledEvent
     */
    client.on(Events.GuildScheduledEventDelete, async (guildScheduledEvent) => {
        const event = guildScheduledEvent;

        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        const formattedCreatedAt = event.createdAt.toLocaleString('en-US', options);

        const embed = new EmbedBuilder()
        embed.setColor("Green")
            .setTitle("\`🟢\` Scheduled Event Deleted")
            .setThumbnail(event.coverImageURL())
            .addFields({ name: "Creator - Creator User ID", value: `${event.creator} - ${event.creatorId}`, inline: false })
            .addFields({ name: "Created At", value: formattedCreatedAt, inline: true })
            .addFields({ name: "Location", value: event.entityMetadata.location.toString(), inline: true })
            .addFields({ name: "Event Name - ID", value: `${event.name} - ${event.id}`, inline: false })
            .addFields({ name: "Description", value: event.description || "None", inline: true })
            .addFields({ name: "Image", value: event.coverImageURL() || "None", inline: true })
            .addFields({ name: "Event URL", value: event.url, inline: false })
            .addFields({ name: "Risk", value: msgConfig.lowRisk, inline: false })

        return sendLog(embed);
    });

    /**
     * Emitted whenever a guild scheduled event gets updated.
     * @param {GuildScheduledEvent} oldGuildScheduledEvent
     * @param {GuildScheduledEvent} newGuildScheduledEvent
     */
    client.on(Events.GuildScheduledEventUpdate, async (oldGuildScheduledEvent, newGuildScheduledEvent) => {
        const oldEvent = oldGuildScheduledEvent;
        const newEvent = newGuildScheduledEvent;

        const differences = await getDifferences(oldEvent, newEvent);

        const embed = new EmbedBuilder()
            .setTitle(`\`🟢\` Scheduled Event Modified`)
            .setDescription("The following changes have been made to scheduled event:")
            .setColor("Green")
            .addFields({ name: "Scheduled Event Name - ID", value: `${oldGuildScheduledEvent.name} - ${oldGuildScheduledEvent.id}`, inline: true })

        for (const key in differences) {
            const { oldValue, newValue } = differences[key];
            embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
        }

        embed.addFields({ name: "Risk", value: msgConfig.lowRisk, inline: false })
        return sendLog(embed);
    });

    /**
     * Emitted whenever a user subscribes to a guild scheduled event
     * @param {GuildScheduledEvent} guildScheduledEvent
     * @param {User} user
     */
    client.on(Events.GuildScheduledEventUserAdd, async (guildScheduledEvent, user) => {
        const event = guildScheduledEvent;

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`\`🔵\` User has Subscribed to Scheduled Event`)
            .addFields({ name: "User - User ID", value: `${user} - ${user.id}`, inline: false })
            .addFields({ name: "Event Name - ID", value: `${guildScheduledEvent.name} - ${guildScheduledEvent.id}`, inline: true })
            .addFields({ name: "Risk", value: msgConfig.info })

        return sendLog(embed);
    });

    /**
     * Emitted whenever a user unsubscribes from a guild scheduled event
     * @param {GuildScheduledEvent} guildScheduledEvent
     * @param {User} user
     */
    client.on(Events.GuildScheduledEventUserRemove, async (guildScheduledEvent, user) => {
        const event = guildScheduledEvent;

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`\`🔵\` User has Unsuscribed to Scheduled Event`)
            .addFields({ name: "User - User ID", value: `${user} - ${user.id}`, inline: false })
            .addFields({ name: "Event Name - ID", value: `${guildScheduledEvent.name} - ${guildScheduledEvent.id}`, inline: true })
            .addFields({ name: "Risk", value: msgConfig.info })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a custom sticker is created in a guild.
     * @param {Sticker} sticker
     */
    client.on(Events.GuildStickerCreate, async (sticker) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        const formattedCreatedAt = sticker.createdAt.toLocaleString('en-US', options);

        var stickerFormat = sticker.format;
        switch (stickerFormat) {
            case 1:
                stickerFormat = "PNG";
                break;
            case 2:
                stickerFormat = "APNG";
                break;
            case 3:
                stickerFormat = "Lottie";
                break;
            case 4:
                stickerFormat = "GIF";
                break;
            default:
                stickerFormat = "Unknown";
        }

        var stickerType = sticker.type;
        switch (stickerType) {
            case 1:
                stickerType = "Official sticker";
                break;
            case 2:
                stickerType = "Server Sticker";
                break;
            default:
                stickerType = "Unknown";
        }

        var user = await sticker.fetchUser(); if (!user) user = "Unknown";
        var stickerPack = await sticker.fetchPack(); if (!stickerPack || !stickerPack.id) stickerPack = "None"; // Prevent error

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`\`🔵\` Server Sticker Created`)
            .setThumbnail(sticker.url)
            .addFields({ name: "Sticker Name - ID", value: `${sticker.name} - ${sticker.id}`, inline: false })
            .addFields({ name: "Created At", value: formattedCreatedAt, inline: true })
            .addFields({ name: "Description", value: sticker.description, inline: true })
            .addFields({ name: "Sticker's Guild - Guild ID", value: `${sticker.guild} - ${sticker.guildId}`, inline: false })
            .addFields({ name: "Format", value: stickerFormat, inline: true })
            .addFields({ name: "Pack ID", value: stickerPack.id || "None", inline: true })
            .addFields({ name: "Sticker Type", value: stickerType, inline: false })
            .addFields({ name: "URL", value: sticker.url, inline: true })
            .addFields({ name: "Uploaded by User - User ID", value: `${user} - ${user.id}`, inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a custom sticker is deleted in a guild.
     * @param {Sticker} sticker
     */
    client.on(Events.GuildStickerDelete, async (sticker) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        const formattedCreatedAt = sticker.createdAt.toLocaleString('en-US', options);

        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(`\`🔵\` Server Sticker Deleted`)
            .setThumbnail(sticker.url)
            .addFields({ name: "Sticker Name - ID", value: `${sticker.name} - ${sticker.id}`, inline: false })
            .addFields({ name: "Created At", value: formattedCreatedAt, inline: true })
            .addFields({ name: "Sticker's Guild - Guild ID", value: `${sticker.guild} - ${sticker.guildId}`, inline: false })
            .addFields({ name: "URL", value: sticker.url, inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a custom sticker is updated in a guild.
     * @param {Sticker} oldSticker
     * @param {Sticker} newSticker
     */
    client.on(Events.GuildStickerUpdate, async (oldSticker, newSticker) => {
        const differences = await getDifferences(oldSticker, newSticker);

        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Server sticker Modified`)
            .setThumbnail(oldSticker.url)
            .setDescription("The following changes have been made to server sticker:")
            .setColor("Blue")
            .addFields({ name: "Sticker Name - ID", value: `${oldSticker.name} - ${oldSticker.id}`, inline: true })

        for (const key in differences) {
            const { oldValue, newValue } = differences[key];
            embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
        }

        embed.addFields({ name: "Risk", value: msgConfig.info, inline: false })
        return sendLog(embed);
    })

    /**
     * Emitted whenever a guild becomes unavailable, likely due to a server outage.
     * @param {Guild} guild
     */
    client.on(Events.GuildUnavailable, async (guild) => {
        const embed = new EmbedBuilder()
            .setTitle(`\`⚫\` Server ${guild.name} is unavailable (probably due to discord API issues)`)
            .setColor("Red")
            .addFields({ name: "Risk", value: msgConfig.discordApiError, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a guild is updated - e.g. name change.
     * @param {Guild} oldGuild
     * @param {Guild} newGuild
     */
    client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
        const differences = await getDifferences(oldGuild, newGuild);

        const embed = new EmbedBuilder()
            .setTitle(`\`🔴\` Server Modified`)
            .setDescription("The following changes have been made to server:")
            .setColor("Red")
            .addFields({ name: "Server Name - ID", value: `${oldGuild.name} - ${oldGuild.id}`, inline: true })

        for (const key in differences) {
            const { oldValue, newValue } = differences[key];
            embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
        }

        embed.addFields({ name: "Risk", value: msgConfig.highRisk, inline: false });
        return sendLog(embed);
    });

    /**
     * Emitted when an interaction is created.
     * @param {Interaction} interaction
     */
    // client.on(Events.InteractionCreate, async (interaction) => {
    //     const embed = new EmbedBuilder()
    //         .setColor("Blue")
    //         .setTitle(`\`🔵\` New Interaction has been created`)
    //         .addFields({ name: "Interaction ID", value: interaction.id, inline: true })
    //         .addFields({ name: "Interaction Type", value: interaction.type, inline: true })
    //         .addFields({ name: "Risk", value: msgConfig.info, inline: false })
    //
    //     return sendLog(embed);
    // });

    /**
     * Emitted when an invite is created. This event requires the PermissionFlagsBits permission for the channel.
     * @param {Invite} invite
     */
    client.on(Events.InviteCreate, async (invite) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        const formattedCreatedAt = invite.createdAt.toLocaleString('en-US', options);

        var formattedExpiresAt;
        if (!invite.expiresAt) // To prevent crash if invite is permanent (expiresAt is null if invite is permanent)
            formattedExpiresAt = "Never";
        else
            formattedExpiresAt = invite.expiresAt.toLocaleString('en-US', options);

        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Server Invite Created`)
            .setColor("Blue")
            .addFields({ name: "Invite Channel - Channel ID", value: `${invite.channel} - ${invite.channelId}`, inline: false })
            .addFields({ name: "Invite Code", value: invite.code, inline: true })
            .addFields({ name: "Created At", value: formattedCreatedAt, inline: true })
            .addFields({ name: "Expires At", value: formattedExpiresAt, inline: true })
            .addFields({ name: "Inviter User - User ID", value: `${invite.inviter} - ${invite.inviterId}`, inline: false })
            .addFields({ name: "Deletable by user?", value: `\`${invite.deletable}\``, inline: true })
            .addFields({ name: "Max Uses", value: `${invite.maxUses}`, inline: true })
            .addFields({ name: "Temp join?", value: `\`${invite.temporary}\``, inline: true })
            .addFields({ name: "Uses until now", value: `${invite.uses}`, inline: false })
            .addFields({ name: "URL", value: invite.url, inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    });

    /**
     * Emitted when an invite is deleted. This event requires the PermissionFlagsBits permission for the channel.
     * @param {Invite} invite
     */
    client.on(Events.InviteDelete, async (invite) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };

        var formattedExpiresAt;
        if (!invite.expiresAt) // To prevent crash if invite is permanent (expiresAt is null if invite is permanent)
            formattedExpiresAt = "Never";
        else
            formattedExpiresAt = invite.expiresAt.toLocaleString('en-US', options);

        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Server Invite Deleted`)
            .setColor("Blue")
            .addFields({ name: "Invite Code", value: invite.code, inline: true })
            .addFields({ name: "Expires At", value: formattedExpiresAt, inline: true })
            .addFields({ name: "URL", value: invite.url, inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever messages are deleted in bulk.
     * @param {Collection<Snowflake, Message>} messages
     * @param {GuildTextBasedChannel} channel
     */
    client.on(Events.MessageBulkDelete, async (messages, channel) => {
        const title = `\`🟣\` Messages Deleted in Bulk`;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor("Purple")
            .addFields({ name: "Channel - Channel ID", value: `${channel} - ${channel.id}`, inline: false })
            .addFields({ name: "Risk", value: msgConfig.raidRisk, inline: false })

        return sendLog(embed, false, channel.id, title);
    })

    /**
     * Emitted whenever a message is created.
     * @param {Message} message
     */
    // client.on(Events.MessageCreate, async (message) => {
    //     return console.log(message);
    // })

    /**
     * Emitted whenever a message is deleted.
     * @param {Message} message
     * Not always is possible to retrieve who deleted the message, this is caused by Discord API lack.
     * Known issues: A) audit log entries are not guaranteed to be generated by the time we receive the messageDelete event.
     *               B) not all deletions create a log. examples: self-deletes or deletions by bots
     */
    client.on(Events.MessageDelete, async (message) => {
        if (!message.guild) return; // Ignore DMs

        const mes = message.content;

        if (!mes) return;

        let attachments = await message.attachments.map(attachment => attachment.url);

        const embed = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle(`\`🟡\` Message Deleted`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields({ name: "Message Author - Author ID", value: `${message.author} - ${message.author.id}`, inline: true })
            .addFields({ name: "Message Content", value: `${mes}`, inline: true })
            .addFields({ name: "Message Channel", value: `${message.channel}`, inline: true });

        if (attachments.length > 0) {
            embed.addFields({ name: "Message Attachments", value: attachments.join(" , ") });
        }

        // Recovers audit logs to find who deleted the message (if possible)
        const auditLogs = await message.guild.fetchAuditLogs({ type: AuditLogEvent.MessageDelete }).catch(console.log);

        let matchingAudit = auditLogs.entries.find(a => a.executorId === message.author.id);

        let executor = null;
        if (matchingAudit)
            executor = await client.guilds.cache.get(msgConfig.guild).members.fetch(matchingAudit.executorId);

        if (matchingAudit && executor) {
            embed.addFields({ name: "Deleted by", value: `${executor} (${executor.id})`, inline: true });
        } else
            embed.addFields({ name: "Deleted by", value: "Unknown (caused by Discord API limitation)", inline: true });

        embed.addFields({ name: "Risk", value: msgConfig.moderateRisk, inline: false });

        return sendLog(embed);
    });

    /**
     * Emitted whenever a user votes in a poll.
     * @param {PollAnswer} pollAnswer
     * @param {Snowflake} userId 
     */
    client.on(Events.MessagePollVoteAdd, async (pollAnswer, userId) => {
        const guildMember = await client.guilds.cache.get(msgConfig.guild).members.fetch(userId);

        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Member Voted in a Poll`)
            .setColor("Blue")
            .addFields({ name: "Member - Member ID", value: `${guildMember} - ${guildMember.id}`, inline: true })
            .addFields({ name: "Answer's Text", value: pollAnswer.text || null, inline: true })
            .addFields({ name: "Emoji Used", value: `${pollAnswer.emoji}`, inline: false })
            .addFields({ name: "Poll Question", value: pollAnswer.poll.question.text || "Unknown", inline: true })
            .addFields({ name: `"${pollAnswer.text}" Answer Votes`, value: pollAnswer.voteCount.toString(), inline: false })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    });

    /**
     * Emitted whenever a user removes their vote in a poll.
     * @param {PollAnswer} pollAnswer
     * @param {Snowflake} userId
     */
    client.on(Events.MessagePollVoteRemove, async (pollAnswer, userId) => {
        const guildMember = await client.guilds.cache.get(msgConfig.guild).members.fetch(userId);

        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Member Removed his Vote in a Poll`)
            .setColor("Blue")
            .addFields({ name: "Member - Member ID", value: `${guildMember} - ${guildMember.id}`, inline: true })
            .addFields({ name: "Answer's Text", value: pollAnswer.text || null, inline: true })
            .addFields({ name: "Emoji Used", value: `${pollAnswer.emoji}`, inline: false })
            .addFields({ name: "Poll Question", value: pollAnswer.poll.question.text || "Unknown", inline: true })
            .addFields({ name: `"${pollAnswer.text}" Answer Votes`, value: pollAnswer.voteCount.toString(), inline: false })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    });

    /**
     * Emitted whenever a reaction is added to a cached message.
     * @param {MessageReaction} messageReaction
     * @param {User} user
     * @param {MessageReactionEventDetails} details 
     */
    client.on(Events.MessageReactionAdd, async (messageReaction, user, details) => {
        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Reaction Added to a Message`)
            .setColor("Blue")
            .addFields({ name: "Emoji Name - ID", value: `${messageReaction.emoji.name} - ${messageReaction.emoji.identifier}`, inline: false })
            .addFields({ name: "Emoji URL", value: messageReaction.emoji.imageURL() || "Def. emojis have no URL", inline: true })
            .addFields({ name: "Emoji Preview", value: messageReaction.emoji.toString(), inline: false })
            .addFields({ name: "Same Emoji Count", value: messageReaction.count.toString(), inline: true })
            .addFields({ name: "Message Author - Author ID", value: `${messageReaction.message.author} - ${messageReaction.message.author.id}`, inline: false })
            .addFields({ name: "Message Channel - Channel ID", value: `${messageReaction.message.channel} - ${messageReaction.message.channelId}`, inline: true })
            .addFields({ name: "Message Content", value: messageReaction.message.content || "Unknown", inline: true })
            .addFields({ name: "Message ID", value: messageReaction.message.id, inline: true })
            .addFields({ name: "Added by User - User ID", value: `${user} - ${user.id}`, inline: false })
            .addFields({ name: "Super Emoji used?", value: details.burst ? "Yes" : "No", inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a reaction is removed from a cached message.
     * @param {MessageReaction} messageReaction
     * @param {User} user
     * @param {MessageReactionEventDetails} details
     */
    client.on(Events.MessageReactionRemove, async (messageReaction, user, details) => {
        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Reaction Removed from a Message`)
            .setColor("Blue")
            .addFields({ name: "Emoji Name - ID", value: `${messageReaction.emoji.name} - ${messageReaction.emoji.identifier}`, inline: false })
            .addFields({ name: "Emoji URL", value: messageReaction.emoji.imageURL() || "Def. emojis have no URL", inline: true })
            .addFields({ name: "Emoji Preview", value: messageReaction.emoji.toString(), inline: false })
            .addFields({ name: "Message Author - Author ID", value: `${messageReaction.message.author} - ${messageReaction.message.author.id}`, inline: false })
            .addFields({ name: "Message Channel - Channel ID", value: `${messageReaction.message.channel} - ${messageReaction.message.channelId}`, inline: true })
            .addFields({ name: "Message Content", value: messageReaction.message.content || "Unknown", inline: true })
            .addFields({ name: "Message ID", value: messageReaction.message.id, inline: true })
            .addFields({ name: "Added by User - User ID", value: `${user} - ${user.id}`, inline: false })
            .addFields({ name: "Super Emoji used?", value: details.burst ? "Yes" : "No", inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever all reactions are removed from a cached message.
     * @param {Message} message
     * @param {Collection<(string|Snowflake), MessageReaction>} reactions
     */
    client.on(Events.MessageReactionRemoveAll, async (message, reactions, messageReactions) => {
        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Message no Longer has any Reaction`)
            .setColor("Blue")
            .addFields({ name: "Message Channel - Channel ID", value: `${message.channel} - ${message.channelId}`, inline: false })
            .addFields({ name: "Message ID", value: message.id, inline: true })
            .addFields({ name: "Message Author - Author ID", value: `${message.author} - ${message.author.id}`, inline: true })
            .addFields({ name: "Message Content", value: message.content || "Unknown", inline: false })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted when a bot removes an emoji reaction from a cached message.
     * @param {MessageReaction} reaction
     */
    client.on(Events.MessageReactionRemoveEmoji, async (reaction) => {
        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Bot Removed an Emoji from a Message`)
            .addFields({ name: "Message Channel - Channel ID", value: `${reaction.message.channel} - ${reaction.message.channelId}`, inline: false })
            .addFields({ name: "Message ID", value: reaction.message.id, inline: true })
            .addFields({ name: "Message Author - Author ID", value: `${reaction.message.author} - ${reaction.message.author.id}`, inline: true })
            .addFields({ name: "Message Content", value: reaction.message.content || "Unknown", inline: false })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a message is updated - e.g. embed or content change.
     * @param {Message} oldMessage
     * @param {Message} newMessage
     * It records only changes in text messages (embeds are not recorded for example)
     */
    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (oldMessage.author.bot || newMessage.author.bot) return;

        if (!oldMessage || !newMessage) return;

        const author = oldMessage.author;

        const oldContent = oldMessage.content;
        const newContent = newMessage.content;

        if (oldContent === newContent) return;

        const embed = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle("\`🟡\` Message Content Edited")
            .setThumbnail(author.displayAvatarURL())

        if (oldContent.length <= 1024 && newContent.length <= 1024) {
            embed
                .addFields({ name: "Old Message Content", value: `${oldContent}`, inline: false })
                .addFields({ name: "New Message Content", value: `${newContent}`, inline: false })
        } else {
            embed
                .addFields({ name: "Old Message Content", value: "Too long to display", inline: false })
                .addFields({ name: "New Message Content", value: "Too long to display", inline: false })
        }

        embed
            .addFields({ name: "Edited By User - User ID", value: `${author} - ${author.id}`, inline: false })
            .addFields({ name: "Risk", value: msgConfig.moderateRisk, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a guild member's presence (e.g. status, activity) is changed.
     * @param {Presence} oldPresence
     * @param {Presence} newPresence
     */
    // client.on(Events.PresenceUpdate, async (oldPresence, newPresence) => {
    //     const embed = new EmbedBuilder()
    //         .setTitle(`\`🔵\` User Changed his status`)
    //         .setColor("Blue")
    //         .addFields({ name: "User", value: `<@${newPresence.userId}> (${newPresence.userId})`, inline: false })
    //         .addFields({ name: "Old Status", value: `\`${oldPresence.status}\``, inline: false })
    //         .addFields({ name: "New Status", value: `\`${newPresence.status}\``, inline: true })
    //         .addFields({ name: "Risk", value: msgConfig.info, inline: false })

    //     return sendLog(embed);
    // })

    /**
     * Emitted when the client becomes ready to start working.
     * @param {Client} client
     */
    // client.on(Events.Ready, async (client) => {
    //     return console.log("Client ", client, " is ready!".red);
    // })

    /**
     * Emitted when a shard's WebSocket disconnects and will no longer reconnect.
     * @param {CloseEvent} event
     * @param {number} id
     */
    // client.on(Events.ShardDisconnect, async (event, id) => {
    //     const embed = new EmbedBuilder()
    //         .setTitle(`\`🔵\` Shard Disconnected`)
    //         .setColor("Blue")
    //         .addFields({ name: "ID", value: id.toString(), inline: false })
    //         .addFields({ name: "Risk", value: msgConfig.info, inline: false })

    //     return sendLog(embed);
    // })

    /**
     * Emitted whenever a shard's WebSocket encounters a connection error.
     * @param {Error} error
     * @param {number} shardId
     */
    // client.on(Events.ShardError, async (error, shardId) => {
    //     const embed = new EmbedBuilder()
    //         .setTitle(`\`🔴\` Shard Error`)
    //         .setColor("Blue")
    //         .addFields({ name: "Shard ID", value: shardId.toString(), inline: false })
    //         .addFields({ name: "Error Name", value: error.name, inline: false })
    //         .addFields({ name: "Error Message", value: error.message, inline: true })
    //         .addFields({ name: "Risk", value: msgConfig.error, inline: false })

    //     return sendLog(embed);
    // })

    /**
     * Emitted when a shard turns ready.
     * @param {number} id
     * @param {Set<Snowflake>} unavilableGuilds
     */
    // client.on(Events.ShardReady, async (id, unavilableGuilds) => {
    //     const embed = new EmbedBuilder()
    //         .setTitle(`\`🔵\` Shard turned ready`)
    //         .setColor("Blue")
    //         .addFields({ name: "ID", value: id.toString(), inline: false })
    //         .addFields({ name: "Risk", value: msgConfig.info, inline: false })

    //     return sendLog(embed);
    // })

    /**
     * Emitted when a shard is attempting to reconnect or re-identify.
     * @param {number} id
     */
    // client.on(Events.ShardReconnecting, async (id) => {
    //     const embed = new EmbedBuilder()
    //         .setTitle(`\`🔵\` Shard Reconnecting`)
    //         .setColor("Blue")
    //         .addFields({ name: "ID", value: id.toString(), inline: false })
    //         .addFields({ name: "Risk", value: msgConfig.info, inline: false })

    //     return sendLog(embed);
    // })

    /**
     * Emitted when a shard resumes successfully.
     * @param {number} id
     * @param {number} replayedEvents
     */
    // client.on(Events.ShardResume, async (id, replayedEvents) => {
    //     const embed = new EmbedBuilder()
    //         .setTitle(`\`🔵\` Shard Resumed`)
    //         .setColor("Blue")
    //         .addFields({ name: "ID", value: id.toString(), inline: false })
    //         .addFields({ name: "Replayed Events", value: replayedEvents.toString(), inline: true })
    //         .addFields({ name: "Risk", value: msgConfig.info, inline: false })

    //     return sendLog(embed);
    // })

    /**
     * Emitted whenever a stage instance is created.
     * @param {StageInstance} stageInstance
     */
    client.on(Events.StageInstanceCreate, async (stageInstance) => {
        var privacyLevel = stageInstance.privacyLevel;

        privacyLevel == 1 ? privacyLevel = "Public" : privacyLevel = "GuildOnly";

        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Conference Started`)
            .setColor("Blue")
            .addFields({ name: "Stage Topic", value: stageInstance.topic, inline: false })
            .addFields({ name: "Stage ID", value: stageInstance.id, inline: true })
            .addFields({ name: "Stage Channel - Channel ID", value: `${stageInstance.channel} - ${stageInstance.channelId}`, inline: true })
            .addFields({ name: "Privacy Level", value: privacyLevel, inline: false })
            .addFields({ name: "Discoverable Disabled?", value: `\`${stageInstance.discoverableDisabled}\``, inline: true })
            .addFields({ name: "Server Scheduled Event", value: stageInstance.guildScheduledEventId || "None", inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a stage instance is deleted.
     * @param {StageInstance} stageInstance
     */
    client.on(Events.StageInstanceDelete, async (stageInstance) => {
        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Conference Ended`)
            .setColor("Blue")
            .addFields({ name: "Stage Topic", value: stageInstance.topic, inline: false })
            .addFields({ name: "Stage Channel - Channel ID", value: `${stageInstance.channel} - ${stageInstance.channelId}`, inline: true })
            .addFields({ name: "Server Scheduled Event", value: stageInstance.guildScheduledEventId || "None", inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a stage instance gets updated - e.g. change in topic or privacy level.
     * @param {StageInstance} oldStageInstance
     * @param {StageInstance} newStageInstance
     */
    client.on(Events.StageInstanceUpdate, async (oldStageInstance, newStageInstance) => {
        const differences = await getDifferences(oldStageInstance, newStageInstance);

        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Conference Modified`)
            .setDescription("The following changes have been made to conference:")
            .setColor("Blue")
            .addFields({ name: "Conference ID", value: oldStageInstance.id, inline: true })
            .addFields({ name: "Conference Topic: ", value: oldStageInstance.topic, inline: true });

        for (const key in differences) {
            const { oldValue, newValue } = differences[key];
            embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
        }

        embed.addFields({ name: "Risk", value: msgConfig.info, inline: false });
        return sendLog(embed);
    })

    /**
     * Emitted whenever a thread is created or when the client user is added to a thread.
     * @param {ThreadChannel} thread
     * @param {boolean} newlyCreated
     */
    client.on(Events.ThreadCreate, async (thread, newlyCreated) => {
        const embed = new EmbedBuilder()
            .setTitle(`\`🟢\` Thread Created`)
            .setColor("Green")
            .addFields({ name: "Thread ID - Name", value: `${thread.id} - ${thread.name}`, inline: false })
            .addFields({ name: "Thread Locked?", value: `\`${thread.locked}\``, inline: true })
            .addFields({ name: "Thread Invitable?", value: `\`${thread.locked}\``, inline: true })
            .addFields({ name: "Archived?", value: `\`${thread.archived}\``, inline: true })
            .addFields({ name: "RateLimit Per User", value: thread.rateLimitPerUser.toString(), inline: false })
            .addFields({ name: "Owner User - User ID", value: `${thread.owner} - ${thread.ownerId}`, inline: true })
            .addFields({ name: "Auto-Archive Time", value: thread.autoArchiveDuration.toString(), inline: false })
            .addFields({ name: "Message Count", value: thread.messageCount.toString(), inline: true })
            .addFields({ name: "Member Count", value: thread.memberCount.toString(), inline: true })
            .addFields({ name: "Newly Created?", value: `\`${newlyCreated}\``, inline: true })
            .addFields({ name: "Risk", value: msgConfig.lowRisk, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a thread is deleted.
     * @param {ThreadChannel} threadChannel
     */
    client.on(Events.ThreadDelete, async (threadChannel) => {
        const embed = new EmbedBuilder()
            .setTitle(`\`🟢\` Thread Deleted`)
            .setColor("Green")
            .addFields({ name: "Thread ID - Name", value: `${thread.id} - ${thread.name}`, inline: false })
            .addFields({ name: "Owner User - User ID", value: `${thread.owner} - ${thread.ownerId}`, inline: true })
            .addFields({ name: "Message Count", value: threadChannel.messageCount.toString(), inline: false })
            .addFields({ name: "Member Count", value: threadChannel.memberCount.toString(), inline: true })
            .addFields({ name: "Risk", value: msgConfig.info, inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever the client user gains access to a text or news channel that contains threads
     * @param {Collection<Snowflake, ThreadChannel>} threads
     * @param {Guild} guild
     */
    // client.on(Events.ThreadListSync, async (threads, guild) => {
    //     return console.log("threads: ", threads, "guild: ", guild)
    // })

    /**
     * Emitted whenever members are added or removed from a thread. This event requires the GatewayIntentBits.GuildMembers privileged gateway intent.
     * @param {Collection<Snowflake, ThreadMember>} addedMembers
     * @param {Collection<Snowflake, ThreadMember>} removedMembers
     */
    client.on(Events.ThreadMembersUpdate, async (addedMembers, removedMembers, thread) => {
        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Thread Members Update`)
            .setColor("Blue")
            .addFields({ name: "Thread ID - Name", value: `${thread.id} - ${thread.name}`, inline: false })

        if (addedMembers.size > 0) {
            embed.addFields({ name: "Added Members", value: addedMembers.map(member => `<@${member.id}> (${member.id})`).join("\n"), inline: false });
        }

        if (removedMembers.size > 0) {
            embed.addFields({ name: "Removed Members", value: removedMembers.map(member => `<@${member.id}> (${member.id})`).join("\n"), inline: false });
        }

        embed.addFields({ name: "Risk", value: msgConfig.lowRisk, inline: false });
        return sendLog(embed);
    })

    /**
     * Emitted whenever the client user's thread member is updated.
     * @param {ThreadMember} oldMember
     * @param {ThreadMember} newMember
     */
    // client.on(Events.ThreadMemberUpdate, async (oldMember, newMember) => {
    //     const differences = await getDifferences(oldMember, newMember);

    //     const embed = new EmbedBuilder()
    //         .setTitle(`\`🟢\` Thread Member Update`)
    //         .setColor("Green")
    //         .addFields({ name: "Thread ID", value: oldMember.id, inline: true })
    //         .addFields({ name: "Thread Name", value: oldMember.name, inline: true });

    //     for (const key in differences) {
    //         const { oldValue, newValue } = differences[key];
    //         embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
    //     }

    //     embed.addFields({ name: "Risk", value: msgConfig.lowRisk, inline: false });
    //     return sendLog(embed);
    // })

    /**
     * Emitted whenever a thread is updated - e.g. name change, archive state change, locked state change.
     * @param {ThreadChannel} oldThread
     * @param {ThreadChannel} newThread
     */
    client.on(Events.ThreadUpdate, async (oldThread, newThread) => {
        const differences = await getDifferences(oldThread, newThread);

        const embed = new EmbedBuilder()
            .setTitle(`\`🟢\` Thread has been modified`)
            .setDescription("The following changes have been made to thread:")
            .setColor("Blue")
            .addFields({ name: "Thread ID - Name", value: `${thread.id} - ${thread.name}`, inline: false })

        for (const key in differences) {
            const { oldValue, newValue } = differences[key];
            embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
        }

        embed.addFields({ name: "Risk", value: msgConfig.lowRisk, inline: false });
        return sendLog(embed);
    })

    /**
     * Emitted whenever a user starts typing in a channel.
     * @param {Typing} typing
     */
    // client.on(Events.TypingStart, async (typing) => {
    //     const embed = new EmbedBuilder()
    //         .setTitle(`\`🔵\` User Started Typing`)
    //         .setColor("Blue")
    //         .addFields({ name: "Channel", value: `${typing.channel} (${typing.channel.id})`, inline: false })
    //         .addFields({ name: "User", value: `${typing.member} (${typing.member.id})`, inline: true })

    //     return sendLog(embed);
    // })

    /**
     * Emitted whenever a user's details (e.g. username) are changed. Triggered by the Discord gateway events UserUpdate, GuildMemberUpdate, and PresenceUpdate.
     * @param {User} oldUser
     * @param {User} newUser
     */
    client.on(Events.UserUpdate, async (oldUser, newUser) => {
        const differences = await getDifferences(oldUser, newUser);

        const embed = new EmbedBuilder()
            .setTitle(`\`🟢\` User details are changed`)
            .setDescription("The following changes have been made to user:")
            .setColor("Green")
            .addFields({ name: "User ID - UserName", value: `${oldUser.id} - ${oldUser.username}`, inline: false })

        for (const key in differences) {
            const { oldValue, newValue } = differences[key];
            embed.addFields({ name: key, value: `Before: ${oldValue}\nAfter: ${newValue}`, inline: false });
        }

        embed.addFields({ name: "Risk", value: msgConfig.lowRisk, inline: false });
        return sendLog(embed);
    })

    /**
     * Emitted whenever a member changes voice state - e.g. joins/leaves a channel, mutes/unmutes.
     * @param {VoiceState} oldState
     * @param {VoiceState} newState
     */
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        const user = await client.users.fetch(newState.id);
        const embed = new EmbedBuilder()
            .setAuthor({ name: user.globalName, iconURL: user.displayAvatarURL() })
            .setColor("Blue");

        // Joined a channel
        if (!oldState.channelId && newState.channelId) {
            embed.setDescription(`User ${user} joined <#${newState.channelId}>`);
        }

        // Left a channel
        if (oldState.channelId && !newState.channelId) {
            embed.setDescription(`User ${user} left <#${oldState.channelId}>`);
        }

        // Changed channel
        if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            embed.setDescription(`User ${user} switched from <#${oldState.channelId}> to <#${newState.channelId}>`);
        }

        if (oldState.serverDeaf !== newState.serverDeaf) {
            if (newState.serverDeaf) {
                embed.setDescription(`User ${user} has been deafened by someone in <#${newState.channelId}>`);
            } else {
                embed.setDescription(`User ${user} has been undeafened by someone in <#${newState.channelId}>`);
            }
        }

        if (oldState.serverMute !== newState.serverMute) {
            if (newState.serverMute) {
                embed.setDescription(`User ${user} has been muted by someone in <#${newState.channelId}>`);
            } else {
                embed.setDescription(`User ${user} has been unmuted by someone in <#${newState.channelId}>`);
            }
        }

        if (oldState.streaming !== newState.streaming) {
            if (newState.streaming) {
                embed.setDescription(`User ${user} started streaming in <#${newState.channelId}>`);
            } else {
                embed.setDescription(`User ${user} finished streaming in <#${newState.channelId}>`);
            }
        }

        if (oldState.selfDeaf !== newState.selfDeaf) {
            if (newState.selfDeaf) {
                embed.setDescription(`User ${user} self-deafened in <#${newState.channelId}>`);
            } else {
                embed.setDescription(`User ${user} self-undeafened in <#${newState.channelId}>`);
            }
        }

        if (oldState.selfMute !== newState.selfMute) {
            if (newState.selfMute) {
                embed.setDescription(`User ${user} self-muted in <#${newState.channelId}>`);
            } else {
                embed.setDescription(`User ${user} self-unmuted in <#${newState.channelId}>`);
            }
        }

        if (oldState.selfVideo !== newState.selfVideo) {
            if (newState.selfVideo) {
                embed.setDescription(`User ${user} started video in <#${newState.channelId}>`);
            } else {
                embed.setDescription(`User ${user} stopped video in <#${newState.channelId}>`);
            }
        }

        if (oldState.suppress !== newState.suppress) {
            if (newState.suppress) {
                embed.setDescription(`User ${user} has been suppressed in <#${newState.channelId}>`);
            } else {
                embed.setDescription(`User ${user} has been unsuppressed in <#${newState.channelId}>`);
            }
        }

        // Embed will be sent only if there is a description (preventing empty embeds)
        if (embed.data.description) {
            embed.addFields({ name: "Risk", value: msgConfig.info, inline: false });
            return sendLog(embed);
        }
    })

    /**
     * Emitted for general warnings.
     * @param {string} info
     */
    client.on(Events.Warn, async (info) => {
        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Warn Info`)
            .setColor("Blue")
            .addFields({ name: "Info", value: "info", inline: false })

        return sendLog(embed);
    })

    /**
     * Emitted whenever a channel has its webhooks changed.
     * @param {TextChannel | NewsChannel | VoiceChannel | StageChannel | ForumChannel | MediaChannel} channel
     */
    client.on(Events.WebhooksUpdate, async (channel) => {
        const embed = new EmbedBuilder()
            .setTitle(`\`🔵\` Channel's Changed`)
            .setColor("Blue")
            .addFields({ name: "Channel - Channel ID", value: `${channel} - ${channel.id}`, inline: false })

        return sendLog(embed);
    })
}