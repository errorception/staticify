'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ignoredDirectories = require('ignore-by-default').directories();
const memoizee = require('memoizee');
const send = require('send');

const staticify = (root, options) => {
    const MAX_AGE = 1000 * 60 * 60 * 24 * 365; // 1 year in milliseconds
    let sendOptsNonVersioned;

    const setOptions = (opts = {}) => {
        let defaultOptions = {
            includeAll: opts.includeAll || false,
            shortHash: opts.shortHash || true,
            pathPrefix: opts.pathPrefix || '/',
            maxAgeNonHashed: opts.maxAgeNonHashed || 0,
            sendOptions: opts.sendOptions || {}
        };

        defaultOptions = Object.assign(defaultOptions, opts);

        defaultOptions.sendOptions.root = root;
        defaultOptions.sendOptions.maxAge = defaultOptions.sendOptions.maxAge || MAX_AGE;

        sendOptsNonVersioned = Object.assign({}, defaultOptions.sendOptions);
        sendOptsNonVersioned.maxAge = defaultOptions.maxAgeNonHashed;

        return defaultOptions;
    };

    const opts = setOptions(options);

    const cachedMakeHash = memoizee(filePath => {
        const fileStr = fs.readFileSync(filePath, 'utf8');
        let hash = crypto.createHash('md5')
            .update(fileStr, 'utf8')
            .digest('hex');

        if (opts.shortHash) {
            hash = hash.slice(0, 7);
        }

        return hash;
    });

    // Walks the directory tree, finding files, generating a version hash
    const buildVersionHash = (directory, root = directory, vers = {}) => {
        if (opts.includeAll === false && ignoredDirectories.some(d => directory.includes(d))) {
            return;
        }

        const files = fs.readdirSync(directory);

        files.forEach(file => {
            const absFilePath = path.posix.join(directory, file);
            const stat = fs.statSync(absFilePath);

            if (stat.isDirectory()) {
                buildVersionHash(absFilePath, root, vers); // Whee!
            } else if (stat.isFile()) {
                vers[`/${path.posix.relative(root, absFilePath)}`] = {absFilePath};
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
        const {absFilePath} = versions[p];
        fileNameParts.push(cachedMakeHash(absFilePath), fileNameParts.pop());

        return path.posix.join(opts.pathPrefix, path.dirname(p), fileNameParts.join('.'));
    };

    // index.<hash>.js -> index.js
    const stripVersion = p => {
        const HASH_LEN = opts.shortHash === true ? 7 : 32;

        const fileName = path.basename(p);
        const fileNameParts = fileName.split('.');
        const fileNameHashPosition = fileNameParts.length - 2;
        const fileNameHash = fileNameParts[fileNameHashPosition];
        const re = new RegExp(`^[0-9a-f]{${HASH_LEN}}$`, 'i');
        const reResult = re.exec(fileNameHash);

        if (fileNameParts.length >= 3 && fileNameHash.length === HASH_LEN &&
            (reResult && reResult[0] === fileNameHash)
        ) {
            const stripped = fileNameParts.slice(0, fileNameHashPosition);

            stripped.push(fileNameParts[fileNameParts.length - 1]);

            return path.join(path.dirname(p), stripped.join('.'));
        }

        return p;
    };

    const serve = req => {
        // eslint-disable-next-line node/no-deprecated-api
        const filePath = stripVersion(url.parse(req.url).pathname);
        const sendOpts = filePath === req.url ? sendOptsNonVersioned : opts.sendOptions;

        return send(req, filePath, sendOpts);
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
        return Object.keys(versions).sort((a, b) => {
            return b.length - a.length;
        }).reduce((f, url) => {
            return f.replace(new RegExp(url, 'g'), getVersionedPath(url));
        }, fileContents);
    };

    const refresh = () => {
        cachedMakeHash.clear();
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
