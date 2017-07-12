'use strict';

require('should');

let pbn = require('..'),
    fs = require('fs'),
    bri = require('../lib/bri-to-pbn'),
    Readable = require('stream').Readable;

function text(doc) {
    var s = new Readable();
    s.push(doc);    // the string you want
    s.push(null);   // indicates end-of-file basically - the end of the stream
    return s;
}

describe('BRI to PBN', () => {

    it('should produce PBN version', done => {
        let version = false;
        fs.createReadStream('./test/sample/dealer.bri')
            .pipe(pbn.convertBRI())
            .on('error', done)
            .on('data', data => {
                if (data.type === 'directive' && data.text.startsWith('PBN')) version = true; })
            .on('end', () => {
                version.should.equal(true);
                done();
            });
    });

    it('should produce board number', done => {
        let board = {};
        fs.createReadStream('./test/sample/dealer.bri')
            .pipe(pbn.convertBRI())
            .on('error', done)
            .on('data', data => {
                if (data.type === 'tag' && data.name === 'Board') board = data; })
            .on('end', () => {
                board.should.have.property('value', '8');
                done();
            });
    });

    it('should allow starting board number', done => {
        let board = {};
        fs.createReadStream('./test/sample/dealer.bri')
            .pipe(pbn.convertBRI({ boardNumber: 10}))
            .on('error', done)
            .on('data', data => {
                if (data.type === 'tag' && data.name === 'Board') board = data; })
            .on('end', () => {
                board.should.have.property('value', '17');
                done();
            });
    });

    it('should produce a deal', done => {
        let deal = {};
        text('180437272408224221062507175150321516492941264031464543351128302039140152133403')
            .pipe(pbn.convertBRI())
            .on('error', done)
            .on('data', data => {
                if (data.type === 'tag' && data.name === 'Deal') deal = data; })
            .on('end', () => {
                deal.should.have.property('cards');
                deal.should.have.property('value', 'N:J987.JT7643.A4.Q .KQ2.QT9.AK98543 AQ42.A8.KJ762.J2 KT653.95.853.T76');
                done();
            });
    });

    it('should produce a deal from an abnormal deal', done => {
        let deal = {};
        text('010203040506070809101112131415161718192021222324252627282930313233343536373839')
            .pipe(pbn.convertBRI())
            .on('error', done)
            .on('data', data => {
                if (data.type === 'tag' && data.name === 'Deal') deal = data; })
            .on('end', () => {
                deal.should.have.property('cards');
                deal.should.have.property('value', 'N:AKQJT98765432... .AKQJT98765432.. ..AKQJT98765432. ...AKQJT98765432');
                done();
            });
    });

    it('should read Big Deal output', done => {
        let deals = [];
        fs.createReadStream('./test/sample/big-deal.bri')
            .pipe(pbn.convertBRI())
            .on('error', done)
            .on('data', data => {
                if (data.type === 'tag' && data.name === 'Deal') deals.push(data); })
            .on('end', () => {
                deals.should.have.length(2);
                deals[0].should.have.property('value', 'N:AJ9.K9542.Q.AK93 K.QJ76.K98763.75 QT6543.AT.JT.T62 872.83.A542.QJ84');
                deals[1].should.have.property('value', 'N:AKQ984.KQT7..Q83 7.J63.AJT82.A754 532.854.Q43.KT62 JT6.A92.K9765.J9');
                done();
            });
    });

    it('should determine if the data is valid', function() {
        bri.check(fs.readFileSync('./test/sample/big-deal.bri')).should.equal(true);
        bri.check(fs.readFileSync('./test/sample/big-deal.pbn')).should.equal(false);
        bri.check(fs.readFileSync('./test/sample/big-deal.dge')).should.equal(false);
        bri.check(fs.readFileSync('./test/sample/big-deal.dup')).should.equal(true);
    });

});
