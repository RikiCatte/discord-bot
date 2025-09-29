const { Innertube, UniversalCache, ClientType } = require('youtubei.js');
let instance = null;

async function getInnertube() {
    if (!instance) {
        instance = await Innertube.create({
            cache: new UniversalCache(true, "/tmp/ytdl-cache"),
            enable_session_cache: true,
            client_type: ClientType.WEB_EMBEDDED,
            generateWithPoToken: true,
            player_id: '0004de42',
        });
    }
    return instance;
}

module.exports = { getInnertube };