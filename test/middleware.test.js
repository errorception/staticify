'use strict';

const http = require('http');
const path = require('path');
const {suite} = require('uvu');
const assert = require('uvu/assert');
const staticify = require('..');

const ROOT = path.join(__dirname, '..');

const middlewareSuite = suite('.middleware');

let server;

middlewareSuite.before(done => {
    server = http.createServer();
    server.listen(12_321, done);
});

middlewareSuite.after(done => {
    server.close(done);
});

middlewareSuite('should call next without error if 404', done => {
    server.once('request', (req, res) => {
        staticify(ROOT).middleware(req, res, err => {
            assert.not.ok(err);

            res.end();
            done();
        });
    });

    http.get('http://localhost:12321/non.existant.file.js');
});

middlewareSuite.run();
