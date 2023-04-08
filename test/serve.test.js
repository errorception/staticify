'use strict';

const http = require('http');
const path = require('path');
const {suite} = require('uvu');
const assert = require('uvu/assert');
const staticify = require('..');

const ROOT = path.join(__dirname, '..');

const serveShortSuite = suite('.serve short hash');

serveShortSuite.before(async context => {
    const staticifyObj = staticify(ROOT);
    context.server = http.createServer((req, res) => {
        staticifyObj.serve(req).pipe(res);
    });
    await context.server.listen(12_321);
});

serveShortSuite.after(async context => {
    await context.server.close();
});

serveShortSuite('should serve files without a hash tag', () => {
    http.get('http://localhost:12321/index.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=0'));
        assert.is(res.statusCode, 200);
    });
});

serveShortSuite('should serve files with a hash tag', () => {
    http.get('http://localhost:12321/index.4e2502b.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=31536000'));
        assert.is(res.statusCode, 200);
    });
});

serveShortSuite('should 404 correctly', () => {
    http.get('http://localhost:12321/non.existant.file.js', res => {
        assert.is(res.statusCode, 404);
    });
});

serveShortSuite.run();

const serveLongSuite = suite('.serve long hash');

serveLongSuite.before(async context => {
    const staticifyObj = staticify(ROOT, {shortHash: false});
    context.server = http.createServer((req, res) => {
        staticifyObj.serve(req).pipe(res);
    });
    await context.server.listen(12_321);
});

serveLongSuite.after(async context => {
    await context.server.close();
});

serveLongSuite('should serve files without a hash tag', () => {
    http.get('http://localhost:12321/index.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=0'));
        assert.is(res.statusCode, 200);
    });
});

serveLongSuite('should serve files with a hash tag', () => {
    http.get('http://localhost:12321/index.4e2502b01a4c92b0a51b1a5a3271eab6.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=31536000'));
        assert.is(res.statusCode, 200);
    });
});

serveLongSuite('should 404 correctly', () => {
    http.get('http://localhost:12321/non.existant.file.js', res => {
        assert.is(res.statusCode, 404);
    });
});

serveLongSuite.run();

const serveCustomOptsSuite = suite('.serve custom serve options');

serveCustomOptsSuite.before(async context => {
    const staticifyObj = staticify(ROOT, {
        maxAgeNonHashed: 7200 * 1000,
        sendOptions: {
            maxAge: 3600 * 1000 // milliseconds
        }
    });
    context.server = http.createServer((req, res) => {
        staticifyObj.serve(req).pipe(res);
    });
    await context.server.listen(12_321);
});

serveCustomOptsSuite.after(async context => {
    await context.server.close();
});

serveCustomOptsSuite('should serve files without a hash tag', () => {
    http.get('http://localhost:12321/index.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=7200'));
        assert.is(res.statusCode, 200);
    });
});

serveCustomOptsSuite('should serve files with a hash tag', () => {
    http.get('http://localhost:12321/index.4e2502b.js', res => {
        assert.ok(res.headers['cache-control'].includes('max-age=3600'));
        assert.is(res.statusCode, 200);
    });
});

serveCustomOptsSuite.run();
