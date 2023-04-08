'use strict';

const http = require('http');
const path = require('path');
const {suite} = require('uvu');
const assert = require('uvu/assert');
const staticify = require('..');

const ROOT = path.join(__dirname, '..');

const serveShortSuite = suite('.serve short hash');

let server;

serveShortSuite.before(done => {
    const staticifyObj = staticify(ROOT);
    server = http.createServer((req, res) => {
        staticifyObj.serve(req).pipe(res);
    });
    server.listen(12_321, done);
});

serveShortSuite.after(done => {
    server.close(done);
});

serveShortSuite('should serve files without a hash tag', done => {
    http.get('http://localhost:12321/index.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=0'));
        assert.is(res.statusCode, 200);
        done();
    });
});

serveShortSuite('should serve files with a hash tag', done => {
    http.get('http://localhost:12321/index.4e2502b.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=31536000'));
        assert.is(res.statusCode, 200);
        done();
    });
});

serveShortSuite('should 404 correctly', done => {
    http.get('http://localhost:12321/non.existant.file.js', res => {
        assert.is(res.statusCode, 404);
        done();
    });
});

serveShortSuite.run();

const serveLongSuite = suite('.serve long hash');

serveLongSuite.before(done => {
    const staticifyObj = staticify(ROOT, {shortHash: false});
    server = http.createServer((req, res) => {
        staticifyObj.serve(req).pipe(res);
    });
    server.listen(12_321, done);
});

serveLongSuite.after(done => {
    server.close(done);
});

serveLongSuite('should serve files without a hash tag', done => {
    http.get('http://localhost:12321/index.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=0'));
        assert.is(res.statusCode, 200);
        done();
    });
});

serveLongSuite('should serve files with a hash tag', done => {
    http.get('http://localhost:12321/index.4e2502b01a4c92b0a51b1a5a3271eab6.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=31536000'));
        assert.is(res.statusCode, 200);
        done();
    });
});

serveLongSuite('should 404 correctly', done => {
    http.get('http://localhost:12321/non.existant.file.js', res => {
        assert.is(res.statusCode, 404);
        done();
    });
});

serveLongSuite.run();

const serveCustomOptsSuite = suite('.serve custom serve options');

serveCustomOptsSuite.before(done => {
    const staticifyObj = staticify(ROOT, {
        maxAgeNonHashed: 7200 * 1000,
        sendOptions: {
            maxAge: 3600 * 1000 // milliseconds
        }
    });
    server = http.createServer((req, res) => {
        staticifyObj.serve(req).pipe(res);
    });
    server.listen(12_321, done);
});

serveCustomOptsSuite.after(done => {
    server.close(done);
});

serveCustomOptsSuite('should serve files without a hash tag', done => {
    http.get('http://localhost:12321/index.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=7200'));
        assert.is(res.statusCode, 200);
        done();
    });
});

serveCustomOptsSuite('should serve files with a hash tag', done => {
    http.get('http://localhost:12321/index.4e2502b.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=3600'));
        assert.is(res.statusCode, 200);
        done();
    });
});

serveCustomOptsSuite.run();
