'use strict';

const path = require('path');
const {suite} = require('uvu');
const assert = require('uvu/assert');
const staticify = require('..');

const ROOT = path.join(__dirname, '..');

const getVersionedPathSuite = suite('.getVersionedPath');

getVersionedPathSuite('should add a hash to the path', () => {
    const versioned = staticify(ROOT)
        .getVersionedPath('/index.js')
        .split('.');

    assert.is(versioned.length, 3);
    assert.is(versioned[0], '/index');
    assert.is(versioned[2], 'js');
    assert.is(versioned[1].length, 7);
    assert.is(/^[0-9a-f]{7}$/i.exec(versioned[1])[0], versioned[1]);
});

getVersionedPathSuite('should add a long hash to the path', () => {
    const versioned = staticify(ROOT, {shortHash: false})
        .getVersionedPath('/index.js')
        .split('.');

    assert.is(versioned.length, 3);
    assert.is(versioned[0], '/index');
    assert.is(versioned[2], 'js');
    assert.is(versioned[1].length, 32);
    assert.is(/^[0-9a-f]{32}$/i.exec(versioned[1])[0], versioned[1]);
});

getVersionedPathSuite('should add a prefix route to the path', () => {
    const versioned = staticify(ROOT, {pathPrefix: '/prefix'})
        .getVersionedPath('/index.js')
        .split('.');

    assert.is(versioned.length, 3);
    assert.is(versioned[0], '/prefix/index');
    assert.is(versioned[2], 'js');
    assert.is(versioned[1].length, 7);
    assert.is(/^[0-9a-f]{7}$/i.exec(versioned[1])[0], versioned[1]);
});

getVersionedPathSuite('shouldn\'t add a hash if the path isn\'t known', () => {
    assert.is(staticify(ROOT).getVersionedPath('/unknown.js'), '/unknown.js');
});

getVersionedPathSuite.run();
