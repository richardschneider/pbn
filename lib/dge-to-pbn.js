'use strict';

/*
For some reason each DGE deal is padded to 128 bytes (with spaces and nulls!)

http://www.duplimate.com/DuplimateClub/convert.pdf

 */

const stream = require('stream');
const util = require('util');
const BlockStream = require('./chunker');
const pipe = require('multipipe');

const crlf = '\r\n';

/*
 * The suit symbols in the DOS character set
 */
const spade = '\u0006';
const heart = '\u0003';
const diamond = '\u0004';
const club = '\u0005';
const suits = [spade, heart, diamond, club];

/** Converts a DGE stream into PBN */
function DgeToPbn(opts) {
    if (!(this instanceof DgeToPbn)) return new DgeToPbn(opts);

    opts = opts || {};
    this.needDirectives = true;
    this.boardNumber = opts.boardNumber || 1;

    stream.Transform.call(this, opts);
}
util.inherits(DgeToPbn, stream.Transform);

DgeToPbn.prototype._transform = function(chunk, encoding, done) {
    if (this.needDirectives) {
        this.produce('% PBN 2.0');
        this.needDirectives = false;
    }
    if (this.boardNumber !== 1) {
        this.produce(''); // empty line for next game.
    }
    this.tag('Board', this.boardNumber++);

    let text = chunk.toString();
    let pbn = 'N:';
    for (let i = 0; i < 68; ++i) {
        let c = text.charAt(i);
        if (c === spade) {
            if (pbn !== 'N:') {
                pbn += ' ';
            }
        } else if (suits.indexOf(c) >= 0) {
            pbn += '.';
        } else {
            pbn += c;
        }
    }

    this.tag('Deal', pbn);
    done();
 };

DgeToPbn.prototype.tag = function(name, value) {
    this.push('[');
    this.push(name);
    this.push(' "');
    if (value !== undefined) {
        this.push(value.toString());
    }
    this.push('"]\r\n');
};

DgeToPbn.prototype.produce = function(pbn) {
    this.push(pbn);
    this.push(crlf);
};

// DGE records are 128 bytes.
let dge = opts => pipe(new BlockStream(128), new DgeToPbn(opts));
dge.check = function(chunk) {
    let cards = chunk.toString('ascii', 0, 68);
    return /[AKQJT98765432\u0003-\u0006]{68}/.test(cards);
};

module.exports = dge;
