'use strict';

/*
BRI format is a subset of DUP format. (DUP also includes DGE
format for verification). Structure is 78 ASCII numbers per deal
to designate the North, East and South hands in that order. Each hand uses 26 bytes.
Each two numbers represents a card (01 = SA, 02 = SK ... 52 = C2).

For some reason each BRI deal is padded to 128 bytes (with spaces and nulls!)

http://www.duplimate.com/DuplimateClub/convert.pdf

 */

const stream = require('stream');
const util = require('util');
const BlockStream = require('./chunker');
const pipe = require('multipipe');

const crlf = '\r\n';
const cards = {
    '01': 'AS',
    '02': 'KS',
    '03': 'QS',
    '04': 'JS',
    '05': 'TS',
    '06': '9S',
    '07': '8S',
    '08': '7S',
    '09': '6S',
    '10': '5S',
    '11': '4S',
    '12': '3S',
    '13': '2S',

    '14': 'AH',
    '15': 'KH',
    '16': 'QH',
    '17': 'JH',
    '18': 'TH',
    '19': '9H',
    '20': '8H',
    '21': '7H',
    '22': '6H',
    '23': '5H',
    '24': '4H',
    '25': '3H',
    '26': '2H',

    '27': 'AD',
    '28': 'KD',
    '29': 'QD',
    '30': 'JD',
    '31': 'TD',
    '32': '9D',
    '33': '8D',
    '34': '7D',
    '35': '6D',
    '36': '5D',
    '37': '4D',
    '38': '3D',
    '39': '2D',

    '40': 'AC',
    '41': 'KC',
    '42': 'QC',
    '43': 'JC',
    '44': 'TC',
    '45': '9C',
    '46': '8C',
    '47': '7C',
    '48': '6C',
    '49': '5C',
    '50': '4C',
    '51': '3C',
    '52': '2C'
};

/** Converts a BRI stream into PBN */
function BriToPbn(opts) {
    if (!(this instanceof BriToPbn)) return new BriToPbn(opts);

    opts = opts || {};
    this.needDirectives = true;
    this.boardNumber = opts.boardNumber || 1;

    stream.Transform.call(this, opts);
}
util.inherits(BriToPbn, stream.Transform);

function parseDeal(text) {
    // Get the specified deal for north, east and south.
    let deal = [];
    for (let i = 0; i < 3 * 13 * 2; i += 2) {
        let id = text.substring(i, i + 2);
        let seat = Math.floor(i / (13 * 2)); // 0 - North, 1 - East, ...
        deal.push({ seat: seat, id: id, order: seat * 100 + Number.parseInt(id), card: cards[id]});
    }

    // Infer the deal for west
    function findID(id) {
        return deal.find(e => e.id === id);
    }
    for (var id in cards) {
        if (!findID(id)) {
            deal.push({ seat: 'W', id: id, order: 300 + Number.parseInt(id), card: cards[id]});
        }
    }

    // Sort by seat, suit and rank.
    deal.sort((a,b) => a.order - b.order);

    // Convert to PBN notation
    let pbn = 'N:';
    let lastSeat = 0, lastSuit = 'S';
    let nextSuit = {S: 'H', H: 'D', D: 'C'};
    for (let card of deal) {
        let rank = card.card.charAt(0);
        let suit = card.card.charAt(1);
        if (lastSeat !== card.seat) {
            for (let next = nextSuit[lastSuit]; next; next = nextSuit[next]) {
                pbn += '.';
            }
            pbn += ' ';
            lastSeat = card.seat;
            lastSuit = 'S';
        }
        if (lastSuit !== suit) {
            for (let next = nextSuit[lastSuit]; next !== suit; next = nextSuit[next]) {
                pbn += '.';
            }
            pbn += '.';
            lastSuit = suit;
        }
        pbn += rank;
    }

    return pbn;
}

BriToPbn.prototype._transform = function(chunk, encoding, done) {
    if (this.needDirectives) {
        this.produce('% PBN 2.0');
        this.needDirectives = false;
    }
    if (this.boardNumber !== 1) {
        this.produce(''); // empty line for next game.
    }
    this.tag('Board', this.boardNumber++);
    this.tag('Deal', parseDeal(chunk.toString()));

    done();
};

BriToPbn.prototype.tag = function(name, value) {
    this.push('[');
    this.push(name);
    this.push(' "');
    if (value !== undefined) {
        this.push(value.toString());
    }
    this.push('"]\r\n');
};

BriToPbn.prototype.produce = function(pbn) {
    this.push(pbn);
    this.push(crlf);
};

// BRI records are 128 bytes.
let bri = opts => pipe(new BlockStream(128), new BriToPbn(opts));
bri.parseDeal = parseDeal;
bri.check = function(chunk) {
    let cards = chunk.toString('ascii', 0, 78);
    return /[0-9]{78}/.test(cards);
};

module.exports = bri;
