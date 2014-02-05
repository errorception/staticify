var should = require("should"),
	staticify = require("../");

describe(".buildVersionHash", function() {
	it("should build a hash of versions", function() {
		staticify.buildVersionHash(__dirname);
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
