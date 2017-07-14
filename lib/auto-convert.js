'use strict';

var PeekStream = require('buffer-peek-stream').BufferPeekStream;

function moveListeners (eventNames, from, to) {
    eventNames.forEach(name => {
        from.listeners(name).forEach(listener => {
            to.addListener(name, listener);
            from.removeListener(name, listener);
        });
    });
}

module.exports = function (opts) {
    var bri = require('./bri-to-pbn');
    var dge = require('./dge-to-pbn');
    var dup = require('./dup-to-pbn');
    var pbn = require('./pbn-stream');
    let peek = new PeekStream({ peekBytes: 1024 });
    peek.on('peek', function (chunk) {
        let pipeline = null;
        if (pbn.check(chunk)) {
            pipeline = pbn(opts);
        } else if (dup.check(chunk)) {
            pipeline = pbn.convertDUP(opts);
        } else if (bri.check(chunk)) {
            pipeline = pbn.convertBRI(opts);
        } else if (dge.check(chunk)) {
            pipeline = pbn.convertDGE(opts);
        } else {
            peek.emit('error', new Error('Unknown format'));
            peek.end();
            return;
        }
        moveListeners(['data', 'error', 'end'], peek, pipeline);
        //pipeline.on('data', data => { console.log('data', JSON.stringify(data)); peek.emit('data', data) });
        //pipeline.on('error', data => peek.emit('error', data));
        //pipeline.on('end', () => peek.emit('end'));
        peek.pipe(pipeline);
    });

    return peek;
};

