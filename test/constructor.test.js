'use strict';

const path = require('path');
const {suite} = require('uvu');
const assert = require('uvu/assert');
const staticify = require('..');

const ROOT = path.join(__dirname, '..');

const constructorSuite = suite('constructor');

constructorSuite('should build an object of versions', () => {
    const versions = staticify(ROOT)._versions;

    assert.instance(versions, Object);
    assert.not.equal(Object.keys(versions).length, 0);
});

constructorSuite.run();
