'use strict';

const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const url = require('url');
const send = require('send');

function buildVersionHash(directory, root, versions) {
    // Walks the directory tree, finding files, generating a version hash
    const files = fs.readdirSync(directory);

    root = root || directory;
    versions = versions || {};

    files.forEach(file => {
        const filePath = path.posix.join(directory, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            buildVersionHash(filePath, root, versions); // Whee!
        } else if (stat.isFile()) {
            const fileStr = fs.readFileSync(filePath, 'utf8');
            const hash = crypto.createHash('md5')
                        .update(fileStr, 'utf8')
                        .digest('hex')
                        .slice(0, 7);

            versions[`/${path.posix.relative(root, filePath)}`] = hash;
        }
    });

    return versions;
}

function stripVersion(p) {
    // index.<hash>.js -> index.js
    const fileName = path.basename(p);
    const fileNameParts = fileName.split('.');

    if (fileNameParts.length >= 3 &&
        fileNameParts[fileNameParts.length - 2].length === 7 &&
        /^[0-9a-f]{7}$/i.exec(fileNameParts[fileNameParts.length - 2])[0] === fileNameParts[fileNameParts.length - 2]
    ) {
        const stripped = fileNameParts.slice(0, fileNameParts.length - 2);

        stripped.push(fileNameParts[fileNameParts.length - 1]);

        return path.join(path.dirname(p), stripped.join('.'));
    }

    return p;
}

module.exports = (root, options) => {
    let versions = buildVersionHash(root);
    options = options || {};

    function getVersionedPath(p) {
        // index.js -> index.<hash>.js
        if (!versions[p]) {
            return p;
        }

        const fileName = path.basename(p);
        const fileNameParts = fileName.split('.');

        fileNameParts.push(versions[p], fileNameParts.pop());

        return path.posix.join(path.dirname(p), fileNameParts.join('.'));
    }

    function serve(req) {
        const filePath = stripVersion(url.parse(req.url).pathname);
        const MAX_AGE = 1000 * 60 * 60 * 24 * 365; // 1 year

        return send(req, filePath, {
            maxage: filePath === req.url ? 0 : MAX_AGE,
            index: options.index || 'index.html',
            ignore: options.hidden,
            root
        });
    }

    function middleware(req, res, next) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            return next();
        }

        serve(req, res)
            .on('error', err => {
                if (err.status === 404) {
                    return next();
                }
                return next(err);
            })
            .pipe(res);
    }

    function replacePaths(fileContents) {
        const urls = Object.keys(versions);

        urls.forEach(url => {
            fileContents = fileContents.replace(url, getVersionedPath(url));
        });

        return fileContents;
    }

    function refresh() {
        versions = buildVersionHash(root);
    }

    return {
        _versions: versions,
        getVersionedPath,
        stripVersion,
        serve,
        refresh,
        middleware,
        replacePaths
    };
};
