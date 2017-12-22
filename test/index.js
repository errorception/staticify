'use strict';

const http = require('http');
const path = require('path');
const should = require('should');
const staticify = require('../');

const ROOT = path.join(__dirname, '/../');

describe('constructor', () => {
    it('should build an object of versions', () => {
        const versions = staticify(ROOT)._versions;

        versions.should.be.an.Object();
        Object.keys(versions).should.not.equal(0);
    });
});

describe('Options work', () => {
    it('`ignoreAll: false` works', () => {
        const versions = staticify(ROOT, {includeAll: true})._versions;
        const matches = Object.keys(versions).filter(ver => ver.match(/node_modules|\.git/)).length > 0;

        matches.should.be.true();
    });
});

describe('.stripVersion', () => {
    it('should strip the hash from a path when necessary', () => {
        staticify(ROOT).stripVersion(path.normalize('/script.4e2502b.js')).should.equal(path.normalize('/script.js'));
        staticify(ROOT).stripVersion(path.normalize('/script.js')).should.equal(path.normalize('/script.js'));
    });

    it('should strip the (long) hash from a path when necessary', () => {
        staticify(ROOT, {shortHash: false}).stripVersion(path.normalize('/script.4e2502b01a4c92b0a51b1a5a3271eab6.js')).should.equal(path.normalize('/script.js'));
        staticify(ROOT, {shortHash: false}).stripVersion(path.normalize('/script.js')).should.equal(path.normalize('/script.js'));
    });
});

describe('.getVersionedPath', () => {
    it('should add a hash to the path', () => {
        let versioned = staticify(ROOT).getVersionedPath('/index.js');

        versioned = versioned.split('.');
        versioned.should.have.a.lengthOf(3);
        versioned[0].should.equal('/index');
        versioned[2].should.equal('js');
        versioned[1].should.have.a.lengthOf(7);
        /^[0-9a-f]{7}$/i.exec(versioned[1])[0].should.equal(versioned[1]);
    });

    it('should add a long hash to the path', () => {
        let versioned = staticify(ROOT, {shortHash: false}).getVersionedPath('/index.js');

        versioned = versioned.split('.');
        versioned.should.have.a.lengthOf(3);
        versioned[0].should.equal('/index');
        versioned[2].should.equal('js');
        versioned[1].should.have.a.lengthOf(32);
        /^[0-9a-f]{32}$/i.exec(versioned[1])[0].should.equal(versioned[1]);
    });

    it('shouldn\'t add a hash if the path isn\'t known', () => {
        staticify(ROOT).getVersionedPath('/unknown.js').should.equal('/unknown.js');
    });
});

describe('.serve', () => {
    describe('short hash', () => {
        let server;

        before(done => {
            server = http.createServer((req, res) => {
                staticify(ROOT).serve(req).pipe(res);
            });
            server.listen(12321, done);
        });

        after(done => {
            server.close(done);
        });

        it('should serve files without a hash tag', done => {
            http.get('http://localhost:12321/index.js', res => {
                res.headers['cache-control'].includes('max-age=0').should.be.true();
                res.statusCode.should.equal(200);
                done();
            });
        });

        it('should serve files with a hash tag', done => {
            http.get('http://localhost:12321/index.4e2502b.js', res => {
                res.headers['cache-control'].includes('max-age=31536000').should.be.true();
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

    describe('long hash', () => {
        let server;

        before(done => {
            server = http.createServer((req, res) => {
                staticify(ROOT, {shortHash: false}).serve(req).pipe(res);
            });
            server.listen(12321, done);
        });

        after(done => {
            server.close(done);
        });

        it('should serve files without a hash tag', done => {
            http.get('http://localhost:12321/index.js', res => {
                res.headers['cache-control'].includes('max-age=0').should.be.true();
                res.statusCode.should.equal(200);
                done();
            });
        });

        it('should serve files with a hash tag', done => {
            http.get('http://localhost:12321/index.4e2502b01a4c92b0a51b1a5a3271eab6.js', res => {
                res.headers['cache-control'].includes('max-age=31536000').should.be.true();
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

    describe('custom serve options', () => {
        let server;

        before(done => {
            server = http.createServer((req, res) => {
                staticify(ROOT, {
                    sendOptions: {
                        maxAge: 3600 * 1000 // milliseconds
                    }
                }).serve(req).pipe(res);
            });
            server.listen(12321, done);
        });

        after(done => {
            server.close(done);
        });

        it('should serve files without a hash tag', done => {
            http.get('http://localhost:12321/index.js', res => {
                res.headers['cache-control'].includes('max-age=0').should.be.true();
                res.statusCode.should.equal(200);
                done();
            });
        });

        it('should serve files with a hash tag', done => {
            http.get('http://localhost:12321/index.4e2502b.js', res => {
                res.headers['cache-control'].includes('max-age=3600').should.be.true();
                res.statusCode.should.equal(200);
                done();
            });
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
            staticify(ROOT).middleware(req, res, err => {
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
        const results = staticify(ROOT).replacePaths('body { background: url(\'/index.js\') }');

        results.should.startWith('body { background: url(\'/index.');
        results.should.endWith('\') }');
        results.includes('index.js').should.be.false();
        results.should.match(/index\.[0-9a-f]{7}\.js/i);
    });

    it('should replace paths in a string (long)', () => {
        const results = staticify(ROOT, {shortHash: false}).replacePaths('body { background: url(\'/index.js\') }');

        results.should.startWith('body { background: url(\'/index.');
        results.should.endWith('\') }');
        results.includes('index.js').should.be.false();
        results.should.match(/index\.[0-9a-f]{32}\.js/i);
    });
});
