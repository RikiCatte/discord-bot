const youtubedl = require('youtube-dl-exec');
const { spawn } = require('child_process');
const fs = require('fs');

async function downloadToMp3ViaYtDlp(url, outputPath) {
    return new Promise((resolve, reject) => {
        const ytdlp = youtubedl.exec(
            url,
            {
                format: 'bestaudio',
                output: '-', // send to stdout
            },
            { stdio: ['ignore', 'pipe', 'pipe'] }
        );

        // ffmpeg to convert to mp3
        const ffmpegProcess = spawn(
            'ffmpeg',
            [
                '-i', 'pipe:0',
                '-vn',
                '-b:a', '128k',
                '-y',
                outputPath
            ],
            { stdio: ['pipe', 'pipe', 'pipe'] }
        );

        ytdlp.stdout.pipe(ffmpegProcess.stdin);

        /*
        ytdlp.stderr.on('data', data => {
          console.log('[yt-dlp stderr]', data.toString());
        });
        ffmpegProcess.stderr.on('data', data => {
          console.log('[ffmpeg stderr]', data.toString());
        });
        */

        ffmpegProcess.on('close', code => {
            if (code === 0 && fs.existsSync(outputPath)) {
                resolve(outputPath);
            } else {
                reject(new Error(`ffmpeg exited with code ${code}`));
            }
        });

        ytdlp.on('error', err => {
            reject(err);
        });

        ffmpegProcess.on('error', err => {
            reject(err);
        });
    });
}

module.exports = { downloadToMp3ViaYtDlp };