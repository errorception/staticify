'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ignoredDirectories = require('ignore-by-default').directories();
const send = require('send');

const staticify = (root, options) => {
    const MAX_AGE = 1000 * 60 * 60 * 24 * 365; // 1 year in milliseconds

    const setOptions = opts => {
        opts = opts || {};

        let defaultOptions = {
            includeAll: opts.includeAll || false,
            shortHash: opts.shortHash || true,
            sendOptions: opts.sendOptions || {}
        };

        defaultOptions = Object.assign(defaultOptions, opts);

        return defaultOptions;
    };

    const opts = setOptions(options);

    // Walks the directory tree, finding files, generating a version hash
    const buildVersionHash = (directory, root, vers) => {
        root = root || directory;
        vers = vers || {};

        if (opts.includeAll === false && ignoredDirectories.some(d => directory.includes(d))) {
            return;
        }

        const files = fs.readdirSync(directory);

        files.forEach(file => {
            const filePath = path.posix.join(directory, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                buildVersionHash(filePath, root, vers); // Whee!
            } else if (stat.isFile()) {
                const fileStr = fs.readFileSync(filePath, 'utf8');
                let hash = crypto.createHash('md5')
                            .update(fileStr, 'utf8')
                            .digest('hex');

                if (opts.shortHash) {
                    hash = hash.slice(0, 7);
                }

                vers[`/${path.posix.relative(root, filePath)}`] = hash;
            }
        });

        return vers;
    };

    let versions = buildVersionHash(root);

    // index.js -> index.<hash>.js
    const getVersionedPath = p => {
        if (!versions[p]) {
            return p;
        }

        const fileName = path.basename(p);
        const fileNameParts = fileName.split('.');

        fileNameParts.push(versions[p], fileNameParts.pop());

        return path.posix.join(path.dirname(p), fileNameParts.join('.'));
    };

    // index.<hash>.js -> index.js
    const stripVersion = p => {
        const HASH_LEN = opts.shortHash === true ? 7 : 32;

        const fileName = path.basename(p);
        const fileNameParts = fileName.split('.');
        const re = new RegExp(`^[0-9a-f]{${HASH_LEN}}$`, 'i');

        if (fileNameParts.length >= 3 &&
            fileNameParts[fileNameParts.length - 2].length === HASH_LEN &&
            re.exec(fileNameParts[fileNameParts.length - 2])[0] === fileNameParts[fileNameParts.length - 2]
        ) {
            const stripped = fileNameParts.slice(0, fileNameParts.length - 2);

            stripped.push(fileNameParts[fileNameParts.length - 1]);

            return path.join(path.dirname(p), stripped.join('.'));
        }

        return p;
    };

    const serve = req => {
        const filePath = stripVersion(url.parse(req.url).pathname);

        opts.sendOptions.maxAge = filePath === req.url ? 0 : (opts.sendOptions.maxAge ? opts.sendOptions.maxAge : MAX_AGE);
        opts.sendOptions.root = root;

        return send(req, filePath, opts.sendOptions);
    };

    const middleware = (req, res, next) => {
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
    };

    const replacePaths = fileContents => {
        return Object.keys(versions).reduce((f, url) => {
            return f.replace(url, getVersionedPath(url));
        }, fileContents);
    };

    const refresh = () => {
        versions = buildVersionHash(root);
    };

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

module.exports = staticify;
