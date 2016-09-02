'use strict';

require('should');

let pbn = require('..'),
    Readable = require('stream').Readable;

describe('PBN', () => {

    function text(doc) {
        var s = new Readable();
        s.push(doc);    // the string you want
        s.push(null);   // indicates end-of-file basically - the end of the stream
        return s;
    }

    it('should have tag with name and value propertied', (done) => {
        let tag = {};
        text('[Dealer "N"]')
            .pipe(pbn())
            .on('error', done)
            .on('data', data => { tag = data; })
            .on('end', () => {
                tag.should.have.property('type', 'tag');
                tag.should.have.property('name', 'Dealer');
                tag.should.have.property('value', 'N');
                done();
            });
    });

    it('should start game on first tag', (done) => {
        let game = false;
        text('[Dealer "N"]')
            .pipe(pbn())
            .on('error', done)
            .on('data', data => { if (data.type === 'game') game = true; })
            .on('end', () => {
                game.should.equal(true);
                done();
            });
    });

    it('should start game on semi-empty line', (done) => {
        let games = 0;
        text('[Dealer "N"]\r\n \r\n[Dealer "E"]\r\n \t   \r\n[Dealer "S"]\r\n')
            .pipe(pbn())
            .on('error', done)
            .on('data', data => { if (data.type === 'game') ++games; })
            .on('end', () => {
                games.should.equal(3);
                done();
            });
    });

    it('should have single line comment (semi-colon) with text property', (done) => {
        let comment = {};
        text('; hello world')
            .pipe(pbn())
            .on('error', done)
            .on('data', data => { comment = data; })
            .on('end', () => {
                comment.should.have.property('type', 'comment');
                comment.should.have.property('text', 'hello world');
                done();
            });
    });

    it('should have single line comment (braces) with text property', (done) => {
        let comment = {};
        text('{ hello world }')
            .pipe(pbn())
            .on('error', done)
            .on('data', data => { comment = data; })
            .on('end', () => {
                comment.should.have.property('type', 'comment');
                comment.should.have.property('text', 'hello world');
                done();
            });
    });

    it('should have multi-line comment with text property', (done) => {
        let comment = {};
        text('{\r\nline 1\r\nline 2\r\n}')
            .pipe(pbn())
            .on('error', done)
            .on('data', data => { comment = data; })
            .on('end', () => {
                comment.should.have.property('type', 'comment');
                comment.should.have.property('text', 'line 1\r\nline 2\r\n');
                done();
            });
    });

    it('should have directive with text property', (done) => {
        let directive = {};
        text('% PBN 2.1')
            .pipe(pbn())
            .on('error', done)
            .on('data', data => { directive = data; })
            .on('end', () => {
                directive.should.have.property('type', 'directive');
                directive.should.have.property('text', 'PBN 2.1');
                done();
            });
    });

});
