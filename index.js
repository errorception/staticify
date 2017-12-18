var send = require("send"),
	path = require("path"),
	crypto = require("crypto"),
	fs = require("fs"),
	url = require("url");

function buildVersionHash(directory, root, versions) {
	// Walks the directory tree, finding files, generating a version hash
	var files = fs.readdirSync(directory);
	root = root || directory;
	versions = versions || {};

	files.forEach(function(file) {
		var filePath = path.join(directory, file),
			stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			buildVersionHash(filePath, root, versions);		// Whee!
		} else if (stat.isFile()) {
			var hash = crypto.createHash("md5").update(fs.readFileSync(filePath, "utf8"), "utf8").digest("hex");
			versions["/" + path.relative(root, filePath)] = hash;
		}
	});

	return versions;
}

function stripVersion(p) {
	// index.<hash>.js -> index.js
	var fileName = path.basename(p);

	var fileNameParts = fileName.split(".");
	if (
		fileNameParts.length >= 3
		&& fileNameParts[fileNameParts.length - 2].length === 32
		&& /^[0-9a-f]{32}$/i.exec(fileNameParts[fileNameParts.length - 2])[0] === fileNameParts[fileNameParts.length - 2]
	) {
		var stripped = fileNameParts.slice(0, fileNameParts.length - 2);
		stripped.push(fileNameParts[fileNameParts.length - 1]);
		return path.join(path.dirname(p), stripped.join("."));
	}

	return p;
}

module.exports = function(root, options) {
	var versions = buildVersionHash(root);
	options = options || {};

	function getVersionedPath(p) {
		// index.js -> index.<hash>.js
		if (!versions[p]) {
			return p;
		}

		var fileName = path.basename(p),
			fileNameParts = fileName.split(".");

		fileNameParts.push(versions[p], fileNameParts.pop());

		return path.join(path.dirname(p), fileNameParts.join("."));
	}

	function serve(req) {
		var filePath = stripVersion(url.parse(req.url).pathname);
		var MAX_AGE = 1000 * 60 * 60 * 24 * 365; // 1 year

		return send(req, filePath, {
			maxage: filePath === req.url ? 0 : MAX_AGE,
			index: options.index || "index.html",
			ignore: options.hidden,
			root: root
		});
	}

	function middleware(req, res, next) {
		if (req.method !== "GET" && req.method !== "HEAD") {
			return next();
		}

		serve(req, res)
			.on("error", function(err) {
				if (err.status === 404) {
					return next();
				}
				return next(err);
			})
			.pipe(res);
	}

	function replacePaths(fileContents) {
		var urls = Object.keys(versions);

		urls.forEach(function(url) {
			fileContents = fileContents.replace(url, getVersionedPath(url));
		});

		return fileContents;
	}

	function refresh() {
		versions = buildVersionHash(root);
	}

	return {
		_versions: versions,
		getVersionedPath: getVersionedPath,
		stripVersion: stripVersion,
		serve: serve,
		refresh: refresh,
		middleware: middleware,
		replacePaths: replacePaths
	};
};
