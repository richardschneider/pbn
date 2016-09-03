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
    this.tagValues = {};
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
        this.produce(null);
        let name = tag[1],
            value = tag[2];
        if (value === '#') {
            value = this.tagValues[name] || '';
        } else if (value.startsWith('##')) {
            value = this.tagValues[name] || value.slice(2);
        }
        this.tag = {
            type: 'tag',
            name: name,
            value: value
        };
        this.tagValues[this.tag.name] = this.tag.value;
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
        let rest = line.slice(1).trim();
        if (rest[rest.length - 1] === '}') {
            this.comment.text = rest.slice(0, -1).trim();
            this.produce(this.comment);
            this.comment = undefined;
        }
    }
    else if (this.tag) {
        this.tag.section = this.tag.section || [];
        this.tag.section.push(line);
    }
    else {
        return done(new Error('Invalid PBN: ' + line));
    }
    done();
};


PbnStream.prototype._flush = function(done) {
    if (this.comment) {
        this.produce(this.comment);
        this.comment = null;
    }
    this.produce(null);
    done();
};

PbnStream.prototype.produce = function(data) {
    if (!this.ingame && data && data.type === 'tag') {
        this.produce({ type: 'game' });
        this.ingame = true;
    }
    if (this.tag) {
        let tag = this.tag;
        this.tag = null;
        this.produce(tag);
    }

    if (data !== null)
        this.push(data);
};

module.exports = opts => pipe(lines(), new PbnStream(opts));
