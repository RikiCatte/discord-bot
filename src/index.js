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

// Music Handling
const { DisTube } = require("distube");
const { SpotifyPlugin } = require('@distube/spotify');
const { YouTubePlugin } = require("@distube/youtube");
const { SoundCloudPlugin } = require("@distube/soundcloud");
const { YtDlpPlugin } = require("@distube/yt-dlp");

client.distube = new DisTube(client, {
    emitNewSongOnly: true,
    emitAddListWhenCreatingQueue: true,
    emitAddSongWhenCreatingQueue: true,
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

//console.log(process.env.TOKEN);
client.login(process.env.TOKEN);