'use strict';

const path = require('path');
const {suite} = require('uvu');
const assert = require('uvu/assert');
const staticify = require('..');

const ROOT = path.join(__dirname, '..');

const middlewareSuite = suite('.replacePaths');

middlewareSuite('should replace paths in a string', () => {
    const results = staticify(ROOT).replacePaths('body { background: url(\'/index.js\') }');

    assert.ok(results.startsWith('body { background: url(\'/index.'));
    assert.ok(results.endsWith('\') }'));
    assert.not.ok(results.includes('index.js'));
    assert.match(results, /index\.[0-9a-f]{7}\.js/i);
});

middlewareSuite('should replace paths in a string (long)', () => {
    const results = staticify(ROOT, {shortHash: false}).replacePaths('body { background: url(\'/index.js\') }');

    assert.ok(results.startsWith('body { background: url(\'/index.'));
    assert.ok(results.endsWith('\') }'));
    assert.not.ok(results.includes('index.js'));
    assert.match(results, /index\.[0-9a-f]{32}\.js/i);
});

middlewareSuite('should replace all paths, not just the first instance of a path', () => {
    const results = staticify(ROOT).replacePaths('/test/font.woff;/test/font.woff');
    const lines = results.split(';');

    assert.match(lines[0], /test\/font\.[0-9a-f]{7}\.woff/i);
    assert.match(lines[1], /test\/font\.[0-9a-f]{7}\.woff/i);
    assert.is(lines[0], lines[1]);
    assert.not.ok(results.includes('test/font.woff'));
});

middlewareSuite('should not mix up paths that are substrings of one another', () => {
    const results = staticify(ROOT).replacePaths('/test/font.woff;/test/font.woff2;/test/font.woff');
    const lines = results.split(';');

    assert.is(lines[0], lines[2]);
    assert.is.not(lines[1], lines[2]);
    assert.match(lines[0], /test\/font\.[0-9a-f]{7}\.woff/i);
    assert.match(lines[1], /test\/font\.[0-9a-f]{7}\.woff2/i);
    assert.not.ok(results.includes('test/font.woff'));
    assert.not.ok(results.includes('test/font.woff2'));
});

middlewareSuite('should not mix up paths that are substrings of one another (long)', () => {
    const results = staticify(ROOT, {shortHash: false}).replacePaths('/test/font.woff;/test/font.woff2;/test/font.woff');
    const lines = results.split(';');

    assert.is(lines[0], lines[2]);
    assert.is.not(lines[1], lines[2]);
    assert.match(lines[0], /test\/font\.[0-9a-f]{32}\.woff/i);
    assert.match(lines[1], /test\/font\.[0-9a-f]{32}\.woff2/i);
    assert.not.ok(results.includes('test/font.woff'));
    assert.not.ok(results.includes('test/font.woff2'));
});

middlewareSuite.run();
