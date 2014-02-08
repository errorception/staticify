var should = require("should"),
	http = require("http"),
	through = require("through"),
	staticify = require("../")(__dirname + "/../");

describe("constructor", function() {
	it("should build a hash of versions", function() {
		staticify._versions.should.be.an.Object;
		Object.keys(staticify._versions).should.not.equal(0);
	});
});

describe(".stripVersion", function() {
	it("should strip the version hash from a path when necessary", function() {
		staticify.stripVersion("/script.4e2502b01a4c92b0a51b1a5a3271eab6.js").should.equal("/script.js");
		staticify.stripVersion("/script.js").should.equal("/script.js");
	});
});

describe(".getVersionedPath", function() {
	it("should add a version number to the path", function() {
		var versioned = staticify.getVersionedPath("/index.js");
		versioned = versioned.split(".");
		versioned.should.have.a.lengthOf(3);
		versioned[0].should.equal("/index");
		versioned[2].should.equal("js");
		versioned[1].should.have.a.lengthOf(32);
		/^[0-9a-f]{32}$/i.exec(versioned[1])[0].should.equal(versioned[1]);
	});

	it("shouldn't add a version number if the path isn't known", function() {
		staticify.getVersionedPath("/unknown.js").should.equal("/unknown.js");
	});
});

describe(".serve", function() {
	var server;

	before(function(done) {
		server = http.createServer(staticify.serve);
		server.listen(12321, done);
	});

	after(function(done) { server.close(done); });

	it("should serve files without a version tag", function(done) {
		http.get("http://localhost:12321/index.js", function(res) {
			res.headers["cache-control"].indexOf("max-age=0").should.not.equal(-1);
			res.statusCode.should.equal(200);
			done();
		});
	});

	it("should serve files with a version tag", function(done) {
		http.get("http://localhost:12321/index.4e2502b01a4c92b0a51b1a5a3271eab6.js", function(res) {
			res.headers["cache-control"].indexOf("max-age=30222000").should.not.equal(-1);
			res.statusCode.should.equal(200);
			done();
		});
	});

	it("should 404 correctly", function(done) {
		http.get("http://localhost:12321/non.existant.file.js", function(res) {
			res.statusCode.should.equal(404);
			done();
		});
	});
});

describe(".middlware", function() {
	var server;

	before(function(done) {
		server = http.createServer();
		server.listen(12321, done);
	});

	after(function(done) { server.close(done); });

	it("should call next without error if 404", function(done) {
		server.once("request", function(req, res) {
			staticify.middleware(req, res, function(err) {
				res.statusCode.should.not.equal(404);
				should.not.exist(err);

				res.end();
				done();
			});
		});

		http.get("http://localhost:12321/non.existant.file.js");
	});
});

describe(".replacePaths", function() {
	it("should replace paths in a stream, and output a stream", function(done) {
		var stream = through().pause().queue("body { background: url('/index.js') }").end();
		stream.pipe(staticify.replacePaths()).on("data", function(data) {
			data.should.startWith("body { background: url('/index.");
			data.should.endWith("') }");
			data.indexOf("index.js").should.equal(-1);
			data.should.match(/index\.[0-9a-f]{32}\.js/i);

			done();
		}).resume();
	});
});
