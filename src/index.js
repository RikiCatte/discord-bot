require('dotenv').config();
require("colors");

const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const eventHandler = require("./handlers/eventHandler");

const process = require('node:process');

// Bot variables init
// const client = new Client({
//     intents: [
//         GatewayIntentBits.Guilds,
//         GatewayIntentBits.GuildMembers,
//         GatewayIntentBits.GuildMessages,
//         GatewayIntentBits.MessageContent,
//         GatewayIntentBits.GuildPresences,
//         GatewayIntentBits.GuildVoiceStates,
//         GatewayIntentBits.GuildMessageReactions,
//     ],
// });

const client = new Client({
    intents: [Object.keys(GatewayIntentBits)], // All intents
    partials: [Object.keys(Partials)], // All partials
});

// Bot variables init

// Exceptions Handling
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('Uncaught Exception Monitor:', err, origin);
});
// Exceptions Handling

// Handling termination signals
// process.on('SIGTERM', () => {
//     console.log('Received SIGTERM, shutting down gracefully...');
//     client.destroy();
//     process.exit(0);
// });

// process.on('SIGINT', () => {
//     console.log('Received SIGINT, shutting down gracefully...');
//     client.destroy();
//     process.exit(0);
// });
// Handling termination signals

const EventEmitter = require('events');

// Set a maximum number of listeners to identify when the limit is exceeded
EventEmitter.defaultMaxListeners = 15; // Temporarily increase the limit per test

process.on('warning', (warning) => {
    if (warning.name === 'MaxListenersExceededWarning') {
        console.warn(`Warning: ${warning.message}`);
        console.trace(); // Shows stack trace to identify where listeners are added
    }
});

// Music Handling
const { DisTube } = require("distube");
const { SpotifyPlugin } = require('@distube/spotify');
const { YouTubePlugin } = require("@distube/youtube");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { YtDlpPlugin } = require("@distube/yt-dlp");

client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    emitAddListWhenCreatingQueue: false,
    emitAddSongWhenCreatingQueue: false,
    plugins: [new YouTubePlugin(), new SpotifyPlugin(), new SoundCloudPlugin(), new YtDlpPlugin()]
});

const { isVoiceChannelEmpty } = require("distube");

// VC Empty
client.on("voiceStateUpdate", (oldState) => {
    if (!oldState.channel) return;

    const voiceChannel = oldState.channel;

    if (isVoiceChannelEmpty(voiceChannel)) {
        try {
            client.distube.voices.leave(voiceChannel.guild.id);
        }
        catch (e) {
            console.log("Error while disconnecting the bot from an empty voice channel, error stack:", e);
        }
    }
});

module.exports = client;
// Music Handling

// Giveaways
const checkGiveaways = require("./utils/giveaways/checkGiveaways.js");
const deleteExpiredGiveaways = require("./utils/giveaways/deleteExpiredGiveaways.js");

setInterval(async () => {
    await checkGiveaways(client);
    await deleteExpiredGiveaways();
}, 60_000); // The bot will check every 60 seconds for ending giveaways and expired giveaways ready to be deleted.
// Giveaways

client.commands = new Collection();
client.config = require('./config.json');

// //disboard bump remember
// client.on(Events.MessageCreate, async message => {

//     if (!message.author.bot) return;

//     if (message.channel != '1130862814404296870') return;

//     const delay = 2 * 60 * 60 * 1000 + 5 * 60 * 1000;

//     setTimeout(() => {
//         const channel = client.channels.cache.get('1148072132790734889');
//         if (channel) {
//             channel.send('<@713376297086353499> <@457974126762786836> Bumpare server con /bump nel canale <#1130862814404296870>');
//         } else {
//             console.error('Canale non trovato.');
//         }
//     }, delay);
// });

// Bot start

const handleLogs = require("./handlers/handleLogs.js");

handleLogs(client);

eventHandler(client);

console.log(`[INFO] Node.js Version: ${process.version}`.magenta);

let retryAttempts = 0;
const maxRetries = 5;

const botConfigCache = require('./utils/BotConfig/botConfigCache.js');
const BotConfig = require('./schemas/BotConfig.js');

function getDefaultServicesFromSchema() {
    const servicesObj = BotConfig.schema.obj.services;
    const defaultServices = {};

    for (const [serviceName, serviceFields] of Object.entries(servicesObj)) {
        const defaults = {};
        for (const [fieldName, fieldSchema] of Object.entries(serviceFields)) {
            if (typeof fieldSchema === "object" && fieldSchema.default !== undefined) {
                defaults[fieldName] = typeof fieldSchema.default === "function"
                    ? fieldSchema.default()
                    : fieldSchema.default;
            } else {
                // If no default is provided, set an empty value based on the type
                if (typeof fieldSchema === "object" && fieldSchema.type) {
                    switch (fieldSchema.type.name) {
                        case "Boolean": defaults[fieldName] = false; break;
                        case "Number": defaults[fieldName] = 0; break;
                        case "String": defaults[fieldName] = ""; break;
                        default: defaults[fieldName] = null;
                    }
                } else {
                    // fallback
                    defaults[fieldName] = "";
                }
            }
        }
        defaultServices[serviceName] = defaults;
    }
    return defaultServices;
}

async function ensureAllServicesInConfig() {
    const defaultServices = getDefaultServicesFromSchema();

    const configs = await BotConfig.find({});
    if (configs.length === 0) {
        console.log("[CONFIG FIX] No config found in MongoDB. It will only be created when /bot-set-service is executed.");
        return;
    }
    let anyUpdated = false;
    for (const config of configs) {
        let updated = false;
        for (const [service, defaults] of Object.entries(defaultServices)) {
            if (!config.services[service]) {
                config.services[service] = { ...defaults };
                updated = true;
                console.log(`[DEBUG] Service "${service}" added to guild ${config.GuildID}`);
            } else {
                for (const [field, value] of Object.entries(defaults)) {
                    if (!(field in config.services[service])) {
                        config.services[service][field] = value;
                        updated = true;
                        console.log(`[DEBUG] Field "${field}" added to service "${service}" for guild ${config.GuildID}`);
                    }
                }
            }
        }
        if (updated) {
            await config.save();
            console.log(`[CONFIG FIX] Config of guild ${config.GuildID} updated with missing services/fields.`);
            anyUpdated = true;
        }
    }
    if (!anyUpdated) {
        console.log("[CONFIG FIX] All services and fields are already present in the config, no updates needed.");
    }
}

async function checkBotConfigOnStartup(client) {
    const guilds = client.guilds.cache.map(g => g.id);
    for (const guildId of guilds) {
        const config = await botConfigCache.getConfig(guildId);
        if (!config || !config.services || Object.keys(config.services).length === 0)
            console.log(`[ERROR] Missing or incomplete configuration for guild ${guildId}. The bot won't work until it's configured with /bot-setup.`.red);
    }
}

function loginBot() {
    //console.log(process.env.TOKEN);
    client.login(process.env.TOKEN)
        .then(async () => {
            console.log(`[INFO] ${client.user.username} is online.`.blue);
            retryAttempts = 0; // Reset retry attempts on successful login
            await ensureAllServicesInConfig();
            await checkBotConfigOnStartup(client);
        })
        .catch((error) => {
            console.error('Failed to login:', error);
            if (retryAttempts < maxRetries) {
                retryAttempts++;
                const retryDelay = Math.pow(2, retryAttempts) * 1000; // Exponential backoff
                console.log(`Retrying in ${retryDelay / 1000} seconds...`);
                setTimeout(loginBot, retryDelay);
            } else {
                console.error('Max retry attempts reached. Exiting...');
                process.exit(1);
            }
        });
}

loginBot();