var stream = require('stream');
const util = require('util');

function Chunker(chunkSize) {
    if (!(this instanceof Chunker)) return new Chunker(chunkSize);

    this.chunkSize = chunkSize || 8192;
    this.buffer = new Buffer(0);

    stream.Transform.call(this);
}
util.inherits(Chunker, stream.Transform);

Chunker.prototype._transform = function (chunk, encoding, done) {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= this.chunkSize) {
        this.push(this.buffer.slice(0, this.chunkSize));
        this.buffer = this.buffer.slice(this.chunkSize);
    }

    done();
};

Chunker.prototype._flush = function (done) {
    if (this.buffer.length) {
        this.push(this.buffer);
    }
    done();
};

module.exports = Chunker;
