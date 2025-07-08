const mongoose = require('mongoose');

const botConfigSchema = new mongoose.Schema({
    GuildID: { type: String, required: true, unique: true },
    services: {
        antilink: {
            enabled: { type: Boolean, default: false },
            Permissions: String,
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
            UserID: String,
            Reason: String,
            BannedAt: { type: Date, default: Date.now }
        },
        bugreport: {
            enabled: { type: Boolean, default: false },
            ReportChannelID: String,
            ReportID: String,
            ReportingMemberID: String,
            ReportingCommand: String,
            ReportDescription: String,
            Solved: { type: Boolean, default: false },
            FixedBy: String
        },
        giveaway: {
            enabled: { type: Boolean, default: false },
            Ended: { type: Boolean, default: false },
            Paused: { type: Boolean, default: false },
            ChannelID: String,
            MessageID: String,
            EndTimestamp: Number,
            RemainingTime: Number,
            Prize: String,
            Participants: [String],
            WinnerCount: { type: Number, default: 1 }
        },
        greeting: {
            enabled: { type: Boolean, default: false },
            Welcome: {
                Enabled: Boolean,
                ChannelID: String,
                Message: String,
                BorderColor: String
            },
            Goodbye: {
                Enabled: Boolean,
                ChannelID: String,
                Message: String,
                BorderColor: String
            }
        },
        invite: {
            enabled: { type: Boolean, default: false },
            ChannelID: String,
            Users: {
                GuildID: String,
                UserID: String,
                TotalInvites: { type: Number, deafult: 0 },
                InviteCodes: [{
                    Code: String,
                    Uses: { type: Number, deafult: 0 }
                }],
                InvitedUsers: [{
                    User: {
                        UserID: String,
                        Fake: { type: Boolean, default: false },
                        Left: { type: Boolean, default: false }
                    }
                }],
            }
        },
        jointocreate: {
            enabled: { type: Boolean, default: false },
            ChannelID: String,
            UserLimit: { type: Number, default: 2 }
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