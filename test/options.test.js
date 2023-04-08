'use strict';

const path = require('path');
const {suite} = require('uvu');
const assert = require('uvu/assert');
const staticify = require('..');

const ROOT = path.join(__dirname, '..');

const optionsSuite = suite('Options work');

optionsSuite('`includeAll: false` works', () => {
    const versions = staticify(ROOT)._versions;
    const matches = Object.keys(versions).filter(ver => ver.match(/node_modules|\.git/)).length === 0;

    assert.is(matches, false);
});

optionsSuite('`includeAll: true` works', () => {
    const versions = staticify(ROOT, {includeAll: true})._versions;
    const matches = Object.keys(versions).some(ver => ver.match(/node_modules|\.git/));

    assert.is(matches, true);
});

optionsSuite.run();
