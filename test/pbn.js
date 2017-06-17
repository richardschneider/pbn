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

    describe('tag', () => {
        it('should have name and value', (done) => {
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

        it('should not require space between name and value', (done) => {
            let tag = {};
            text('[Dealer"N"]')
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

        it('should have section data as an arrray of lines', (done) => {
            let tag = {};
            text('[Foo "bar"]\ndata 1\ndata 2')
                .pipe(pbn())
                .on('error', done)
                .on('data', data => { tag = data; })
                .on('end', () => {
                    tag.should.have.property('type', 'tag');
                    tag.should.have.property('name', 'Foo');
                    tag.should.have.property('value', 'bar');
                    tag.should.have.property('section');
                    tag.section.should.have.length(2);
                    tag.section[0].should.equal('data 1');
                    tag.section[1].should.equal('data 2');
                    done();
                });
        });

        it('should have section data as an arrray of tokens', (done) => {
            let tag = {};
            text('[Foo "bar"]\ndata 1\ndata 2')
                .pipe(pbn())
                .on('error', done)
                .on('data', data => { tag = data; })
                .on('end', () => {
                    tag.should.have.property('type', 'tag');
                    tag.should.have.property('name', 'Foo');
                    tag.should.have.property('value', 'bar');
                    tag.should.have.property('tokens');
                    tag.tokens.should.have.length(4);
                    tag.tokens[0].should.equal('data');
                    tag.tokens[1].should.equal('1');
                    tag.tokens[2].should.equal('data');
                    tag.tokens[3].should.equal('2');
                    done();
                });
        });

        describe('inherit value', () => {
            it('should be previous value', (done) => {
                let tag = {};
                text('[Event "Some event"]\n\n[Event "#"]')
                    .pipe(pbn())
                    .on('error', done)
                    .on('data', data => { tag = data; })
                    .on('end', () => {
                        tag.should.have.property('type', 'tag');
                        tag.should.have.property('name', 'Event');
                        tag.should.have.property('value', 'Some event');
                        done();
                    });
            });

            it('should default to empty string', (done) => {
                let tag = {};
                text('[Event "#"]')
                    .pipe(pbn())
                    .on('error', done)
                    .on('data', data => { tag = data; })
                    .on('end', () => {
                        tag.should.have.property('type', 'tag');
                        tag.should.have.property('name', 'Event');
                        tag.should.have.property('value', '');
                        done();
                    });
            });

            it('should default to optional value', (done) => {
                let tag = {};
                text('[Event "##somewhere"]')
                    .pipe(pbn())
                    .on('error', done)
                    .on('data', data => { tag = data; })
                    .on('end', () => {
                        tag.should.have.property('type', 'tag');
                        tag.should.have.property('name', 'Event');
                        tag.should.have.property('value', 'somewhere');
                        done();
                    });
            });
        });

    });

    describe('tag Deal', () => {
        it('should have cards', (done) => {
            let deal = {};
            text('[Deal "N:JT6.AK95.J9.KJ72 - ..8. A4.T863.AQ643.5"]')
                .pipe(pbn())
                .on('error', done)
                .on('data', data => { deal = data; })
                .on('end', () => {
                    deal.should.have.property('type', 'tag');
                    deal.should.have.property('name', 'Deal');
                    deal.should.have.property('value', 'N:JT6.AK95.J9.KJ72 - ..8. A4.T863.AQ643.5');
                    deal.should.have.property('cards');
                    deal.cards.should.containEql({ seat: 'N', suit: 'S', rank: 'J'});
                    deal.cards.should.containEql({ seat: 'S', suit: 'D', rank: '8'});
                    deal.cards.should.containEql({ seat: 'W', suit: 'C', rank: '5'});
                    done();
                });
        });
    });

    describe('tag Note', () => {
        it('should have a number and text', (done) => {
            let note = {};
            text('[Note "1:..."]')
                .pipe(pbn())
                .on('error', done)
                .on('data', data => { note = data; })
                .on('end', () => {
                    note.should.have.property('type', 'tag');
                    note.should.have.property('name', 'Note');
                    note.should.have.property('value', '1:...');
                    note.should.have.property('number', 1);
                    note.should.have.property('text', '...');
                    done();
                });
        });
    });

    describe('game', () => {
        it('should start on first tag', (done) => {
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

        it('should start on semi-empty line', (done) => {
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
    });

    describe('comment', () => {
        it('should start with semi-colon on single line', (done) => {
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

        it('should be surrounded with braces on single line', (done) => {
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

        it('should have multiple lines with braces', (done) => {
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
