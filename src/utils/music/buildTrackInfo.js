function buildTrackInfo(queue) {
    const current = queue.currentTrack;
    return {
        title: current?.title,
        author: current?.author,
        source: current?.source,
        duration: current?.durationMS || current?.duration,
        currentDuration: queue.node.getTimestamp(),
        progressBar: queue.node.createProgressBar ? queue.node.createProgressBar() : "",
        thumbnail: current?.thumbnail,
        requester: current?.requestedBy,
        paused: queue.node.isPaused(),
        volume: queue.node.volume,
        loop: queue.repeatMode === 1 ? "track" : queue.repeatMode === 2 ? "queue" : "off",
        queueLength: queue.tracks.size,
        biquad: queue.biquadPreset || "off",
        equalizer: queue.equalizerPreset || "Off",
        ffmpegFilters: queue.filters?.ffmpeg?.filters || [],
    };
}

module.exports = buildTrackInfo;