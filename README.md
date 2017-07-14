# pbn

[![Travis build status](https://travis-ci.org/richardschneider/pbn.svg)](https://travis-ci.org/richardschneider/pbn)
[![Coverage Status](https://coveralls.io/repos/github/richardschneider/pbn/badge.svg?branch=master)](https://coveralls.io/github/richardschneider/pbn?branch=master)
 [![npm version](https://badge.fury.io/js/pbn.svg)](https://badge.fury.io/js/pbn)

**pbn** parses and transforms a [Portable Bridge Notation](http://www.tistis.nl/pbn/) stream into a series of javascript objects via the [node stream](https://nodejs.org/api/stream.html#stream_api_for_stream_consumers) design pattern.  Each PBN object contains a `type` and other properties that describes the PBN line(s).

The [change log](https://github.com/richardschneider/pbn/releases) is automatically produced with
the help of [semantic-release](https://github.com/semantic-release/semantic-release).

## Features

* Directive - `% PBN 2.1`
* Tag - `[Event "somewhere"]`
* Inherited tag value - `[Event "#"]` or `[Event "##somewhere"]`
* Section data added to previous tag
* Comment - `; ...` or `{ ... }`
* Game - starts with first `Tag` or semi-empty line
* Deal - easily parseable hands
* Conversion of deal file formats (BRI) to pbn

## Getting started

Install the latest version with [npm](http://blog.npmjs.org/post/85484771375/how-to-install-npm)

    > npm install pbn

## Usage

Include the package

    const pbn = require('pbn')

Process a PBN file

    fs.createReadStream('foo.pbn')
        .pipe(pbn())
        .on('data', data => {
            console.log(JSON.stringify(data));
        })
        .on('error', err => {
            process.stderr.write(err.message);
            process.exit(1);
        });

Process a PBN string

    const Readable = require('stream').Readable;

    function text(doc) {
        var s = new Readable();
        s.push(doc);    // the string you want
        s.push(null);   // indicates end-of-file basically - the end of the stream
        return s;
    }

    text(' ... ')
        .pipe(pbn())
        .on('data', data => {
            console.log(JSON.stringify(data));
        })
        .on('error', err => {
            process.stderr.write(err.message);
            process.exit(1);
        });

## Data event

The data event, `.on('data', data => {...})`, is emitted when a PBN line(s) is completely parsed.  It contains the `type` and other properties.

### directive

Is emitted when a line begins with a percent(`%`).  For example

    % PBN 2.1

produces

    {
        type: 'directive',
        text: 'PBN 2.1'
    }

Note that whitespace is trimmed.

### comment (single line)

Is emitted when a line begins with a semi-colon(';'). For example

    ; The quick brown fox ...

produces

    {
        type: 'comment',
        text: 'The quick brown fox ...'
    }

Note that whitespace is trimmed.

### comment (multi-line)

Is emitted when a group of lines start with `{` and ends with `}`. For example

    {
      the quick browk fox
      ...
    }

produces

    {
        type: 'comment',
        text: '  the quick browk fox\r\n  ...\r\n'
    }

Note that whitespace is **not** trimmed.

### game

Is emitted when the first `tag` or a semi-empty line is encountersed.

    {
        type: 'game'
    }

### tag

Is emitted when a line  starts with `[` and ends with `]`. For example

    [Dealer "N"]

produces

    {
        type: 'tag',
        name: 'Dealer',
        value: 'N'
    }

#### Contract

The `Contract` tag provides an easy parseable contract. For example

    [Contract "3NTX"]

produces

    {
        type: 'tag',
        name: 'Contract',
        value: '3NTX',
        level: 3,
        denomination: 'NT',
        risk: 'X'
    }

A passed in contract, `[Contract "Pass"]`, sets the level to zero.

    {
        type: 'tag',
        name: 'Contract',
        value: 'Pass',
        level: 0,
        risk: ''
    }

#### Deal

The `Deal` tag provides an easy parseable hand. For example

    [Deal "N:JT6.AK95.J9.KJ72 - - A4.T863.AQ643.53"]

produces

    {
        type: 'tag',
        name: 'Deal',
        value: 'N:JT6.AK95.J9.KJ72 - - A4.T863.AQ643.5'
        cards: [
          { seat: 'N', suit: 'S', rank: 'J'},
          { seat: 'N', suit: 'S', rank: 'T'},
          { seat: 'N', suit: 'S', rank: '6'},
          { seat: 'N', suit: 'H', rank: 'A'},
          ...
          { seat: 'W', suit: 'S', rank: 'A'},
          ...
          { seat: 'W', suit; 'C', rank: '5'}
        }
    }

#### Note

The `Note` tag provides a `number` and `text` property. For example

    [Note "1:non-forcing 6-9 points, 6-card"]

produces

    {
        type: 'tag',
        name: 'Note',
        value: '1:non-forcing 6-9 points, 6-card',
        number: 1,
        text: 'non-forcing 6-9 points, 6-card'
    }

## Conversion

Some deal formats can be converted into a pbn stream.  The `pbn.convertXXX()` function is used, where XXX is the
name of the deal format.

    fs.createReadStream('foo.bri')
        .pipe(pbn.convertBRI(options))
        .on('data', data => {
            console.log(JSON.stringify(data));
        });
        
The deal formats and PBN can also be automatically detected, using `pbn.autoConvert()`

    fs.createReadStream('foo.bri')
        .pipe(pbn.autoConvert(options))
        .on('data', data => {
            console.log(JSON.stringify(data));
        });


### BRI

`pbn.convertBRI(options)`
* options.boardNumber - the starting board number, defaults to 1.

BRI format is a subset of DUP format. (DUP also includes DGE
format for verification). Structure is 78 ASCII numbers per deal
to designate the North, East and South hands in that order. Each hand uses 26 bytes.
Each two numbers represents a card (01 = SA, 02 = SK ... 52 = C2).

For some reason each BRI deal is padded to 128 bytes (with spaces and nulls!)

http://www.duplimate.com/DuplimateClub/convert.pdf

### DGE

`pbn.convertDGE(options)`
* options.boardNumber - the starting board number, defaults to 1.

DGE format is a subset of DUP format; again padded to 128 bytes.

http://www.duplimate.com/DuplimateClub/convert.pdf

### DUP

`pbn.convertDUP(options)`
* options.boardNumber - the starting board number, defaults to 1.

http://www.duplimate.com/DuplimateClub/convert.pdf

# Command line

A command line interface (`pbn`) is also available. It transforms a PBN file or `stdin` into JSON.

To transform a file, try something like:

    > pbn foo.pbn

To use with `*nix` pipes

    > cat foo.pbn | pbn

# License
The [MIT license](LICENSE).

Copyright © 2016 Richard Schneider [(makaretu@gmail.com)](mailto:makaretu@gmail.com?subject=ISQ)
