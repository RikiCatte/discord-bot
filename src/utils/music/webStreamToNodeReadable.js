const { Readable } = require('stream');

/**
 * Converts a Web ReadableStream (YouTube.js returns a webStream) to a Node.js Readable stream.
 * @param {*} webStream - The Web ReadableStream to convert.
 * @returns {Readable} - The converted Node.js Readable stream.
 */
function webStreamToNodeReadable(webStream) {
    if (!webStream || typeof webStream.getReader !== 'function') throw new Error("The provided stream is not a valid Web ReadableStream.");

    const reader = webStream.getReader();
    return new Readable({
        async read() {
            try {
                const { done, value } = await reader.read();
                if (done) this.push(null);
                else this.push(Buffer.from(value));
            } catch (error) {
                this.destroy(error);
            }
        }
    });
}

module.exports = { webStreamToNodeReadable };