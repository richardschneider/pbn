#! /usr/bin/env node

var pbn = require('../index'),
    fs = require('fs'),
    process = require('process');

var doc = process.stdin;
if (process.argv[2])
    doc = fs.createReadStream(process.argv[2]);

doc
    .pipe(pbn.autoConvert())
    .on('data', data => {
        console.log(JSON.stringify(data));
    })
    .on('error', err => {
        process.stderr.write(err.message);
        process.exit(1);
    });
