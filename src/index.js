// ====== Modules import ======
require('dotenv').config();
require('colors');

const process = require('node:process');
const mongoose = require('mongoose');
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { Player } = require('discord-player');
const { YoutubeiExtractor } = require('discord-player-youtubei');
const { DefaultExtractors } = require('@discord-player/extractor');

// Local modules
const eventHandler = require('./handlers/eventHandler');
const handleLogs = require('./handlers/handleLogs');
const BotConfig = require('./schemas/BotConfig.js');
const suppressYoutubeJSLibErrors = require("./utils/suppressYoutubeJSLibErrors.js");
const {
    getDefaultServicesFromSchema,
    ensureAllServicesInConfig,
    checkBotConfigOnStartup,
} = require('./utils/BotConfig/startupUtils.js');

// ====== Global exception handling ======
process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err);
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('Uncaught Exception Monitor:', err, origin);
});

// ====== Main function ======
async function main() {
    // Discord client initialization
    const client = new Client({
        intents: Object.values(GatewayIntentBits),
        partials: Object.values(Partials),
    });

    // Music player setup
    const player = new Player(client, {
        blockStreamFrom: [],
        blockExtractors: []
    });
    await player.extractors.loadMulti(DefaultExtractors);

    // FIX: https://github.com/LuanRT/YouTube.js/issues/1043
    await player.extractors.register(YoutubeiExtractor, {
        streamOptions: {
            useClient: "WEB_EMBEDDED",
        },
        generateWithPoToken: true,
        innertubeConfigRaw: {
            player_id: '0004de42',
        }
    });

    // Custom client properties
    client.commands = new Collection();
    client.config = require('./config.json');

    // Event and log handling
    handleLogs(client);
    eventHandler(client);

    // MongoDB connection and Discord login with retry logic
    let retryAttempts = 0;
    const maxRetries = 5;

    async function startBot() {
        try {
            await mongoose.connect(process.env.MONGODB_TOKEN, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log(`[INFO] Connected to the MongoDB database.`.green);
            console.log(`[INFO] Node.js Version: ${process.version}`.magenta);
            const Discord = require('discord.js');
            console.log(`[INFO] Discord.js Version: ${Discord.version}`.blue);

            await client.login(process.env.TOKEN);
            console.log(`[INFO] ${client.user.username} is online.`.red);

            await ensureAllServicesInConfig();
            await checkBotConfigOnStartup(client);
        } catch (error) {
            console.error('Failed to start bot:', error);
            retryAttempts++;
            if (retryAttempts < maxRetries) {
                const retryDelay = Math.pow(2, retryAttempts) * 1000;
                console.log(`Retrying in ${retryDelay / 1000} seconds...`);
                setTimeout(startBot, retryDelay);
            } else {
                console.error('Max retry attempts reached. Exiting...');
                process.exit(1);
            }
        }
    }

    startBot();

    // Music event handlers
    const StatusManager = require('./utils/music/statusManager');
    const statusManager = new StatusManager(client);

    require('./events/musicEvents')(player, client, statusManager);

    // Suppress non-critical errors from youtubei.js library
    suppressYoutubeJSLibErrors();
}

main();