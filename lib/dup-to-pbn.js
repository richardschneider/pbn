'use strict';

/*
http://www.duplimate.com/DuplimateClub/convert.pdf

 */

const stream = require('stream');
const util = require('util');
const BlockStream = require('./chunker');
const pipe = require('multipipe');
const bri = require('./bri-to-pbn');
const dge = require('./dge-to-pbn');

const crlf = '\r\n';


/** Converts a DUP stream into PBN */
function DupToPbn(opts) {
    if (!(this instanceof DupToPbn)) return new DupToPbn(opts);

    opts = opts || {};
    this.needDirectives = true;
    this.boardNumber = opts.boardNumber || 1;

    stream.Transform.call(this, opts);
}
util.inherits(DupToPbn, stream.Transform);

DupToPbn.prototype._transform = function(chunk, encoding, done) {
    if (this.needDirectives) {
        this.produce('% PBN 2.0');
        this.needDirectives = false;
    }
    if (this.boardNumber !== 1) {
        this.produce(''); // empty line for next game.
    }
    this.tag('Board', this.boardNumber++);

    let text = chunk.toString();
    let a = bri.parseDeal(text.substring(0, 78));

    this.tag('Deal', a);
    done();
 };

DupToPbn.prototype.tag = function(name, value) {
    this.push('[');
    this.push(name);
    this.push(' "');
    if (value !== undefined) {
        this.push(value.toString());
    }
    this.push('"]\r\n');
};

DupToPbn.prototype.produce = function(pbn) {
    this.push(pbn);
    this.push(crlf);
};

// DUP records are 156 bytes.
let dup = opts => pipe(new BlockStream(156), new DupToPbn(opts));
dup.check = function(chunk) {
    return bri.check(chunk) && dge.check(chunk.slice(78));
};

module.exports = dup;
