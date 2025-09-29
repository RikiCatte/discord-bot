const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { webStreamToNodeReadable } = require('./webStreamToNodeReadable');
const { sanitizeFilename } = require('../sanitizeFilename');
const { downloadToMp3ViaYtDlp } = require('./downloadToMp3ViaYtDlp');

async function downloadTrackToMp3({ track, getInnertube }) {
    const tmpDir = '/tmp';
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    let safeTitle = sanitizeFilename(track.title, 32);
    if (!safeTitle) safeTitle = `track_${Date.now()}`;
    const outputPath = `${tmpDir}/${safeTitle}.mp3`;

    try {
        const innertube = await getInnertube();
        const videoUrl = track.url;
        const videoIdMatch = videoUrl.match(/v=([a-zA-Z0-9_-]{11})/) || videoUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
        const videoId = videoIdMatch ? videoIdMatch[1] : track.id;

        const rawStream = await innertube.download(videoId, { quality: 'best', type: 'audio' });
        const nodeStream = webStreamToNodeReadable(rawStream);

        await new Promise((resolve, reject) => {
            ffmpeg(nodeStream)
                .audioBitrate(128)
                .format('mp3')
                .output(outputPath)
                .on('end', resolve)
                .on('error', reject)
                .run();
        });

        return outputPath;
    } catch (err) {
        if (track.url.includes('youtube.com') || track.url.includes('youtu.be')) {
            const fallbackPath = await downloadToMp3ViaYtDlp(track.url, outputPath);
            return fallbackPath;
        }
        throw err;
    }
}

module.exports = { downloadTrackToMp3 };