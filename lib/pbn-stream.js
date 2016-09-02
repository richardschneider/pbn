'use strict';

var stream = require('stream');
var util = require('util');
var lines = require('lstream');
var pipe = require('multipipe');

let tagLine = /^\[\s*([a-zA-Z0-9_]+)\s+"(.*)"\s*\]$/;
let emptyLine = /^\s*$/;
let crlf = '\r\n';

function PbnStream(opts) {
    if (!(this instanceof PbnStream)) return new PbnStream(opts);
    opts = opts || {};
    opts.objectMode = true;
    stream.Transform.call(this, opts);
}
util.inherits(PbnStream, stream.Transform);


PbnStream.prototype._transform = function(line, encoding, done) {
    if (this.comment) {
        if (line[0] === '}') {
            this.produce(this.comment);
            this.comment = undefined;
        }
        else {
            this.comment.text += line + crlf;
        }
    }
    else if (line[0] === '[') {
        let tag = line.match(tagLine);
        if (!tag)
            return done(new Error('Invalid PBN for tagpair: ' + line));
        this.produce({
            type: 'tag',
            name: tag[1],
            value: tag[2]
        });
    }
    else if (line[0] === ';') {
        this.produce({
            type: 'comment',
            text: line.slice(1).trim()
        });
    }
    else if (line[0] === '%') {
        this.produce({
            type: 'directive',
            text: line.slice(1).trim()
        });
    }
    else if (emptyLine.test(line)) {
       this.produce({
            type: 'game'
        });
    }
    else if (line[0] === '{') {
        this.comment = {
            type: 'comment',
            text: ''
        };
    }
    else {
        return done(new Error('Invalid PBN: ' + line));
    }
    done();
};


PbnStream.prototype._flush = function(done) {
    done();
};

PbnStream.prototype.produce = function(data) {
    if (!this.ingame && data.type === 'tag') {
        this.produce({ type: 'game' });
        this.ingame = true;
    }
    this.push(data);
};

module.exports = opts => pipe(lines(), new PbnStream(opts));
