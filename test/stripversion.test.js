'use strict';

const path = require('path');
const {suite} = require('uvu');
const assert = require('uvu/assert');
const staticify = require('..');

const ROOT = path.join(__dirname, '..');

const stripVersionSuite = suite('.stripVersion');

stripVersionSuite('should strip the hash from a path when necessary', () => {
    assert.is(staticify(ROOT).stripVersion(path.normalize('/script.4e2502b.js')), path.normalize('/script.js'));
    assert.is(staticify(ROOT).stripVersion(path.normalize('/script.js')), path.normalize('/script.js'));
});

stripVersionSuite('should not fail when the path contains a 7 character string that is not a hash', () => {
    assert.is(staticify(ROOT).stripVersion(path.normalize('/script.abcdefg.html')), path.normalize('/script.abcdefg.html'));
});

stripVersionSuite('should strip the (long) hash from a path when necessary', () => {
    assert.is(staticify(ROOT, {shortHash: false}).stripVersion(path.normalize('/script.4e2502b01a4c92b0a51b1a5a3271eab6.js')), path.normalize('/script.js'));
    assert.is(staticify(ROOT, {shortHash: false}).stripVersion(path.normalize('/script.js')), path.normalize('/script.js'));
});

stripVersionSuite('should not fail when the path contains a 32 character string that is not a hash', () => {
    assert.is(staticify(ROOT).stripVersion(path.normalize('/script.abcdefgabcdefgabcdefgabcdefgabcd.html')), path.normalize('/script.abcdefgabcdefgabcdefgabcdefgabcd.html'));
});

stripVersionSuite.run();
