'use strict';

require('should');

let pbn = require('..'),
    dup = require('../lib/dup-to-pbn'),
    fs = require('fs');

describe('DUP to PBN', () => {

    it('should produce PBN version', done => {
        let version = false;
        fs.createReadStream('./test/sample/big-deal.dup')
            .pipe(pbn.convertDUP())
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
        fs.createReadStream('./test/sample/big-deal.dup')
            .pipe(pbn.convertDUP())
            .on('error', done)
            .on('data', data => {
                if (data.type === 'tag' && data.name === 'Board') board = data; })
            .on('end', () => {
                board.should.have.property('value', '2');
                done();
            });
    });

    it('should allow starting board number', done => {
        let board = {};
        fs.createReadStream('./test/sample/big-deal.dup')
            .pipe(pbn.convertDUP({ boardNumber: 10}))
            .on('error', done)
            .on('data', data => {
                if (data.type === 'tag' && data.name === 'Board') board = data; })
            .on('end', () => {
                board.should.have.property('value', '11');
                done();
            });
    });

    it('should read Big Deal output', done => {
        let deals = [];
        fs.createReadStream('./test/sample/big-deal.dup')
            .pipe(pbn.convertDUP())
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
        dup.check(fs.readFileSync('./test/sample/big-deal.bri')).should.equal(false);
        dup.check(fs.readFileSync('./test/sample/big-deal.pbn')).should.equal(false);
        dup.check(fs.readFileSync('./test/sample/big-deal.dge')).should.equal(false);
        dup.check(fs.readFileSync('./test/sample/big-deal.dup')).should.equal(true);
    });


});
