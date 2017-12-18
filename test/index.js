'use strict';

const http = require('http');
const path = require('path');
const should = require('should');
const staticify = require('../')(path.join(__dirname, '/../'));

describe('constructor', () => {
    it('should build a hash of versions', () => {
        staticify._versions.should.be.an.Object();
        Object.keys(staticify._versions).should.not.equal(0);
    });
});

describe('.stripVersion', () => {
    it('should strip the version hash from a path when necessary', () => {
        staticify.stripVersion(path.normalize('/script.4e2502b01a4c92b0a51b1a5a3271eab6.js')).should.equal(path.normalize('/script.js'));
        staticify.stripVersion(path.normalize('/script.js')).should.equal(path.normalize('/script.js'));
    });
});

describe('.getVersionedPath', () => {
    it('should add a version number to the path', () => {
        let versioned = staticify.getVersionedPath('/index.js');
        versioned = versioned.split('.');
        versioned.should.have.a.lengthOf(3);
        versioned[0].should.equal('/index');
        versioned[2].should.equal('js');
        versioned[1].should.have.a.lengthOf(32);
        /^[0-9a-f]{32}$/i.exec(versioned[1])[0].should.equal(versioned[1]);
    });

    it('shouldn\'t add a version number if the path isn\'t known', () => {
        staticify.getVersionedPath('/unknown.js').should.equal('/unknown.js');
    });
});

describe('.serve', () => {
    let server;

    before(done => {
        server = http.createServer((req, res) => {
            staticify.serve(req).pipe(res);
        });
        server.listen(12321, done);
    });

    after(done => {
        server.close(done);
    });

    it('should serve files without a version tag', done => {
        http.get('http://localhost:12321/index.js', res => {
            res.headers['cache-control'].indexOf('max-age=0').should.not.equal(-1);
            res.statusCode.should.equal(200);
            done();
        });
    });

    it('should serve files with a version tag', done => {
        http.get('http://localhost:12321/index.4e2502b01a4c92b0a51b1a5a3271eab6.js', res => {
            res.headers['cache-control'].indexOf('max-age=31536000').should.not.equal(-1);
            res.statusCode.should.equal(200);
            done();
        });
    });

    it('should 404 correctly', done => {
        http.get('http://localhost:12321/non.existant.file.js', res => {
            res.statusCode.should.equal(404);
            done();
        });
    });
});

describe('.middleware', () => {
    let server;

    before(done => {
        server = http.createServer();
        server.listen(12321, done);
    });

    after(done => {
        server.close(done);
    });

    it('should call next without error if 404', done => {
        server.once('request', (req, res) => {
            staticify.middleware(req, res, err => {
                should.not.exist(err);

                res.end();
                done();
            });
        });

        http.get('http://localhost:12321/non.existant.file.js');
    });
});

describe('.replacePaths', () => {
    it('should replace paths in a string', () => {
        const results = staticify.replacePaths('body { background: url(\'/index.js\') }');

        results.should.startWith('body { background: url(\'/index.');
        results.should.endWith('\') }');
        results.indexOf('index.js').should.equal(-1);
        results.should.match(/index\.[0-9a-f]{32}\.js/i);
    });
});
