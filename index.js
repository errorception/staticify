var send = require("send"),
	path = require("path"),
	crypto = require("crypto"),
	fs = require("fs");

var versions = {};

function buildVersionHash(directory, root) {
	var files = fs.readdirSync(directory);
	root = root || directory;

	files.forEach(function(file) {
		var filePath = path.join(directory, file),
			stat = fs.statSync(filePath);

		if(stat.isDirectory()) {
			buildVersionHash(filePath, root);
		} else if(stat.isFile()) {
			var hash = crypto.createHash("md5").update(fs.readFileSync(filePath, "utf8"), "utf8").digest("hex");
			versions["/" + path.relative(root, filePath)] = hash;
		}
	});
}

function stripVersion(p) {
	var fileName = path.basename(p);

	var fileNameParts = fileName.split(".");
	if(
		fileNameParts.length >= 3
		&& fileNameParts[fileNameParts.length - 2].length == 32
		&& /^[0-9a-f]{32}$/i.exec(fileNameParts[fileNameParts.length - 2])[0] === fileNameParts[fileNameParts.length - 2]
	) {
		var stripped = fileNameParts.slice(0, fileNameParts.length - 2);
		stripped.push(fileNameParts[fileNameParts.length - 1]);
		return path.join(path.dirname(p), stripped.join("."));
	}

	return p;
}

function getVersionedPath(p) {
	if(!versions[p]) return p;

	var fileName = path.basename(p),
		fileNameParts = fileName.split(".");

	var extension = fileNameParts.pop();
	fileNameParts.push(versions[p], extension);

	return path.join(path.dirname(p), fileNameParts.join("."))
}

function serve(req, res) {
	
}

module.exports = {
	_versions: versions,
	buildVersionHash: buildVersionHash,
	stripVersion: stripVersion,
	getVersionedPath: getVersionedPath
}
