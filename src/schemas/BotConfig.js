const mongoose = require('mongoose');

const botConfigSchema = new mongoose.Schema({
    GuildID: { type: String, required: true, unique: true },
    services: {
        antilink: {
            enabled: { type: Boolean, default: false },
            Permissions: String,
            Whitelist: [{ UserID: String }],
        },
        nitroboost: {
            enabled: { type: Boolean, default: false },
            channelID: String,
            embedColor: String,
            embedTitle: String,
            embedMessage: String,
            boostMessage: String,
        },
        captcha: {
            enabled: { type: Boolean, default: false },
            RoleID: String,
            LogChannelID: String, // Where success or failure captcha attempts are logged
            ReJoinLimit: Number,
            ExpireInMS: Number,
            Captcha: String,
            users: [{
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
            status: { type: String, default: 'dnd' }, // 'online', 'idle', 'dnd', 'invisible'
            interval: { type: Number, default: 10000 }
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
            UserID: String,
            Reason: String,
            KickedBy: String,
            KickedAt: { type: Date, default: Date.now }
        },
        logs: {
            enabled: { type: Boolean, default: false },
            ChannelID: String,
            RiskyLogs: [{
                RiskyLogID: String,
                ChannelID: String,
                Title: String,
                Date: String,
                Solved: Boolean,
                SolvedBy: String,
            }]
        },
        moderation: {
            enabled: { type: Boolean, default: false },
            MultiGuilded: { type: Boolean, default: true }, // ??
            MuteRoleID: String,
            LogChannelID: String
        },
        messagesleaderboard: {
            enabled: { type: Boolean, default: false },
            UserID: String,
            Messages: Number
        },
        freegames: {
            enabled: { type: Boolean, default: false },
            title: String,
            description: String,
            url: String,
            source: String,
            startDate: Date,
            endDate: Date,
            notifiedAt: Date,
            image: Buffer
        },
        suspicioususerjoin: {
            enabled: { type: Boolean, default: false },
            SusUserID: String,
            MessageID: String,
            JoinDate: String,
            TakenAction: Boolean,
            Action: String,
            ModeratedBy: String,
        },
        ticket: {
            enabled: { type: Boolean, default: false },
            setup: {
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
                }]
            },
            tickets: [{
                MembersID: [String],
                TicketID: String,
                ChannelID: String,
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
        },
        warning: {
            enabled: { type: Boolean, default: false },
            UserID: String,
            UserTag: String,
            Content: Array
        },
        welcome: {
            enabled: { type: Boolean, default: false },
            ChannelID: String,
            Message: String,
            RoleID: String,
            RulesChannelID: String
        }
    },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BotConfig', botConfigSchema);