'use strict';

require('should');

let pbn = require('..'),
    fs = require('fs');


describe('Auto conversion', () => {

    it('should detect PBN', done => {
        let deals = [];
        fs.createReadStream('./test/sample/big-deal.pbn')
            .pipe(pbn.autoConvert())
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

    it('should detect BRI', done => {
        let deals = [];
        fs.createReadStream('./test/sample/big-deal.bri')
            .pipe(pbn.autoConvert())
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

    it('should detect DUP', done => {
        let deals = [];
        fs.createReadStream('./test/sample/big-deal.dup')
            .pipe(pbn.autoConvert())
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

    it('should detect DGE', done => {
        let deals = [];
        fs.createReadStream('./test/sample/big-deal.dge')
            .pipe(pbn.autoConvert())
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

    it('should error on unknown format', done => {
        fs.createReadStream('./package.json')
            .pipe(pbn.autoConvert())
                .on('error', err => {
                    err.should.have.property('message', 'Unknown format');
                    done();
                })
                .on('end', () => {
                    done(new Error('Did not emit error', null));
                });
    });
});
