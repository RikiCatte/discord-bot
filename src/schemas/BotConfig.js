const { VoiceChannel } = require('discord.js');
const mongoose = require('mongoose');

const botConfigSchema = new mongoose.Schema({
    GuildID: { type: String, required: true, unique: true },
    services: {
        antilink: {
            enabled: { type: Boolean, default: false },
            Permissions: String,
            Whitelist: [{ UserID: String }],
        },
        antitor: {
            enabled: { type: Boolean, default: false },
        },
        ban: {
            enabled: { type: Boolean, default: false },
            Bans: [{
                UserID: String,
                BannedBy: String, // Could be inaccurate (Discord does not provide a direct way to get who banned, this is a workaround)
                Reason: String,
                BannedAt: Date
            }]
        },
        bugreport: {
            enabled: { type: Boolean, default: false },
            ReportChannelID: String,
            Reports: [{
                ReportID: String, // ID of the message in the report channel
                ReportingMemberID: String,
                ReportingCommand: String,
                ReportDescription: String,
                Solved: { type: Boolean, default: false },
                FixedBy: String
            }]
        },
        captcha: {
            enabled: { type: Boolean, default: false },
            RoleID: String,
            LogChannelID: String, // Where success or failure captcha attempts are logged
            ReJoinLimit: Number,
            ExpireInMS: Number,
            Captcha: String,
            users: [{
                GuildID: String, // Redundant but necessary because we can't access guildId from DMs!
                UserID: String,
                Username: String,
                JoinedAt: String,
                ReJoinedTimes: { type: Number, default: 0 },
                Captcha: String,
                CaptchaStatus: String,
                CaptchaExpired: { type: Boolean, default: false },
                MissedTimes: { type: Number, default: 0 },
                Resent: { type: Boolean, default: false },
                ResentBy: String,
                Bypassed: { type: Boolean, default: false },
                BypassedBy: String,
            }]
        },
        dinamic_activities: {
            enabled: { type: Boolean, default: false },
            activities: {
                type: [String],
                default: [
                    'Watching the stars',
                    'Listening to the wind',
                    'Coding in the dark',
                    'Playing with shadows',
                    'Exploring the unknown',
                    'Ping'
                ]
            },
            status: String, // 'online', 'idle', 'dnd', 'invisible'
            interval: { type: Number, default: 10000 }
        },
        freegames: {
            enabled: { type: Boolean, default: false },
            ChannelID: String,
            Games: [{
                ID: String,
                Title: String,
                Description: String,
                Url: String,
                Source: String,
                StartDate: Date,
                EndDate: Date,
                NotifiedAt: Date,
                Image: Buffer
            }]
        },
        giveaway: {
            enabled: { type: Boolean, default: false },
            giveaways: [{
                ChannelID: String,
                MessageID: String,
                EndTimestamp: Number,
                RemainingTime: Number,
                Prize: String,
                Ended: Boolean,
                Paused: Boolean,
                Participants: [String],
                WinnerCount: { type: Number, default: 1 },
                Winners: [String]
            }],
        },
        greeting: {
            enabled: { type: Boolean, default: false },
            Welcome: {
                Enabled: Boolean,
                ChannelID: String,
                PresenceStatus: String, // online, idle, offline, dnd, invisible, streaming, phone
                BorderColor: String,
                Message: String,
                ReplyMessage: String, // Message to reply to the user
            },
            Goodbye: {
                Enabled: Boolean,
                ChannelID: String,
                PresenceStatus: String,
                BorderColor: String,
                Message: String,
                ReplyMessage: String,
            }
        },
        jointocreate: {
            enabled: { type: Boolean, default: false },
            ChannelID: String,
            UserLimit: Number
        },
        kick: {
            enabled: { type: Boolean, default: false },
            Kicks: [{
                UserID: String,
                KickedBy: String, // Could be inaccurate (Discord does not provide a direct way to get who kicked, this is a workaround)
                Reason: String,
                KickedAt: Date
            }]
        },
        logs: {
            enabled: { type: Boolean, default: false },
            LogChannelID: String,
            StaffChannelID: String,
            RiskyLogs: [{
                RiskyLogID: String,
                ChannelID: String,
                Title: String,
                Date: String,
                Solved: Boolean,
                SolvedBy: String,
            }]
        },
        music: {
            enabled: { type: Boolean, default: false },
            DJRoleID: String,
            VoiceChannelID: String,
            EmbedChannelID: String,
            EmbedMessageID: String,
        },
        nitroboost: {
            enabled: { type: Boolean, default: false },
            channelID: String,
            embedColor: String,
            embedTitle: String,
            embedMessage: String,
            boostMessage: String,
        },
        poll: {
            enabled: { type: Boolean, default: false },
            ChannelID: String,
            Polls: [{
                MessageID: String,
                Question: String,
                Options: [String],
                Votes: [Number],
                Ended: Boolean, // The poll will be marked as ended only when the poll.end() function is called by a member
                CreatedAt: Date,
                EndsAt: Date
            }]
        },
        serverstats: {
            enabled: { type: Boolean, default: false },
            channels: [{
                ChannelID: String,
                Label: String, // e.g. "👥 Total users:"
                RoleID: String, // optional, if we want to count users with a specific role
                Type: String, // "total", "members", "bots", "role", "activity"
                Activity: String, // optional, e.g. "online", "dnd", "idle", "offline"
                ShowCount: { type: Boolean, default: true }
            }],
            showActivityStats: { type: Boolean, default: false }
        },
        suggest: {
            enabled: { type: Boolean, default: false },
            ChannelID: String,
            Suggestions: [{
                SuggestionMessageID: String,
                AuthorID: String,
                Name: String,
                Description: String,
                SubmittedAt: Date,
                Upvotes: [String],
                Downvotes: [String],
            }],
        },
        suspicioususerjoin: {
            enabled: { type: Boolean, default: false },
            SusUsers: [{
                SusUserID: String,
                MessageID: String,
                JoinDate: String,
                TakenAction: Boolean,
                Action: String,
                ModeratedBy: String,
            }],
        },
        ticket: {
            enabled: { type: Boolean, default: false },
            Channel: String,
            Category: String,
            Transcripts: String,
            Handlers: String,
            Everyone: String,
            Description: String,
            EmbedColor: String,
            CustomId: [String],
            TicketCategories: [String],
            MessageId: String,
            Emojis: [String],
            CategoriesEmojiArray: [{
                category: String,
                emoji: String
            }],
            tickets: [{
                MembersID: [String],
                TicketID: String,
                ChannelID: String,
                OpenedAt: Date,
                Closed: Boolean,
                Locked: Boolean,
                Type: String,
                Claimed: Boolean,
                ClaimedBy: String
            }]
        },
        unban: {
            enabled: { type: Boolean, default: false },
            Unbans: [{
                UserID: String,
                UnbannedBy: String, // Could be inaccurate (Discord does not provide a direct way to get who unbanned, this is a workaround)
                Reason: String,
                UnbannedAt: Date
            }]
        }
    },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BotConfig', botConfigSchema);