'use strict';

const fs = require('fs');
const path = require('path');
const {suite} = require('uvu');
const assert = require('uvu/assert');
const staticify = require('..');

const ROOT = path.join(__dirname, '..');

const refreshSuite = suite('.refresh');

refreshSuite('should empty the cache of file hashes after a refresh()', () => {
    fs.writeFileSync(path.join(__dirname, 'variable_file.txt'), 'File Content 1');

    const staticifyObj = staticify(ROOT);
    const versionedPath = staticifyObj.getVersionedPath('/test/variable_file.txt');
    const versioned = versionedPath.split('.');

    assert.is(versioned.length, 3);
    assert.is(versioned[0], '/test/variable_file');
    assert.is(versioned[2], 'txt');

    staticifyObj.refresh();

    fs.writeFileSync(path.join(__dirname, 'variable_file.txt'), 'File Content 2');

    const versionedPath2 = staticifyObj.getVersionedPath('/test/variable_file.txt');

    assert.is(versionedPath2.length, 31);
    assert.is.not(versionedPath2, versionedPath);
});

refreshSuite.run();
