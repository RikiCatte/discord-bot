require('dotenv').config();
const twitchAPI = require("twitch-api");
const msgConfig = require("../../messageConfig.json");

const twitch = new twitchAPI({
    clientId: `${process.env.twitchIdClient}`,
    clientSecret: `${process.env.twitchClientSecret}`,
});

module.exports = async (client) => {
    const channelId = `${msgConfig.twitchAlertChannelId}`;

    // Monitora gli eventi di live streaming di Twitch
    // twitch.streams.followed({ user_id: 'ID_DEL_TUO_UTENTE_TWITCH' }, (err, res) => {
    //     if (err) {
    //         console.error(err);
    //         return;
    //     }

    //     // Invia notifiche Discord quando un utente va live
    //     res.data.forEach((stream) => {
    //         const twitchUsername = stream.user_name;
    //         const twitchUrl = `https://www.twitch.tv/${twitchUsername}`;

    //         const embed = {
    //             title: `${twitchUsername} è in live su Twitch!`,
    //             url: twitchUrl,
    //             color: '#6441a5',
    //             thumbnail: { url: stream.thumbnail_url },
    //             fields: [
    //                 { name: 'Titolo', value: stream.title },
    //                 { name: 'Visualizzatori', value: stream.viewer_count.toString() },
    //             ],
    //         };

    //         const channel = client.channels.cache.get(channelId);
    //         if (channel) {
    //             channel.send({ embeds: [embed] });
    //         }
    //     });
    // });
}