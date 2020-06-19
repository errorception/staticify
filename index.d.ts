import {SendOptions} from 'send';
import {RequestHandler} from 'express';
import {Request} from 'express-serve-static-core';

export type StaticifyOptions = {
    /**
     * Include all files when scanning the public directory.
     * By default, the directories from [ignore-by-default](https://github.com/novemberborn/ignore-by-default/blob/master/index.js) are ignored.
     *
     * @type {boolean}
     * @default false
     */
    includeAll?: boolean;
    /**
     * Generate a short (7-digit) MD5 hash instead of the full (32-digit) one.
     *
     * @type {boolean}
     * @default true
     */
    shortHash?: boolean;
    /**
     * If you are using the staticify convenience middleware through a specific route, it is necessary to indicate the route in this option.
     *
     * @type {string}
     * @default '/'
     */
    pathPrefix?: string;
    /**
     * `maxAge` for assets without a hash such as /image.png passed to [send](https://github.com/pillarjs/send).
     *
     * Can be defined as a number of milliseconds or string accepted by [ms](https://www.npmjs.org/package/ms#readme) module (eg. `'5d'`, `'1y'`, etc.)
     *
     * @type {(string|number)}
     * @default 0
     */
    maxAgeNonHashed?: string | number;
    /**
     * You can pass any [send](https://github.com/pillarjs/send) options; used in `middleware` and `serve` functions.
     *
     * @type {SendOptions}
     * @default { maxAge: '1y' } // hashed assets
     * @default { maxAge: 0 } // non-hashed assets
     */
    sendOptions?: SendOptions;
};

export interface Statificy {
    _versions: Record<string, any>;
    /**
     * Does the following transformation to the `path`, and returns immediately:
     *
     * ```js
     * staticify.getVersionedPath('/path/to/file.ext'); // --> /path/to/file.<MD5 of the contents of file.ext>.ext
     * ```
     *
     * This method is meant to be used inside your templates.
     *
     * This method is really fast (simply an in-memory lookup) and returns immediately.
     * When you initialize this module, it crawls your public folder synchronously at startup, and pre-determines all the MD5 hashes for your static files.
     * This slows down application startup slightly, but it keeps the runtime performance at its peak.
     *
     * @param {string} path
     * @returns {string}
     */
    getVersionedPath: (path: string) => string;
    /**
     * Takes the input string, and replaces any paths it can understand. For example:
     *
     * ```js
     * staticify.replacePaths('body { background: url("/index.js") }');
     * ```
     *
     * returns
     *
     * ```js
     * "body { background: url('/index.d766c4a983224a3696bc4913b9e47305.js') }"
     * ```
     *
     * Perfect for use in your build script, to modify references to external paths within your CSS files.
     *
     * @param {string} input
     * @returns {string}
     */
    replacePaths: (input: string) => string;
    /**
     * Removes the MD5 identifier in a path.
     *
     * ```js
     * staticify.stripVersion('/path/to/file.ae2b1fca515949e5d54fb22b8ed95575.ext'); // --> /path/to/file.ext
     * ```
     *
     * Note, this function doesn't verify that the hash is valid. It simply finds what looks like a hash and strips it from the path.
     *
     * @param {string} path
     * @returns {string}
     */
    stripVersion: (path: string) => string;
    /**
     * Handles an incoming request for the file.
     * Internally calls `.stripVersion` to strip the version identifier, and serves the   file with a `maxAge` of one year, using [send](https://github.com/pillarjs/send).
     * Returns a stream that can be `.pipe`d to a http response stream.
     * See [here](https://github.com/pillarjs/send#options) for the options you can pass.
     *
     * ```js
     * staticify.serve(req, {
     *     sendOptions: {
     *         maxAge: 3600 * 1000 // milliseconds
     *     }
     * }).pipe(res);
     * ```
     *
     * @param {Request} req
     */
    serve: (req: Request) => void;
    /**
     * Rebuilds the MD5 version cache described above.
     * Use this method sparingly.
     * This crawls your public folder synchronously (in a blocking fashion) to rebuild the cache.
     * This is typically only useful when you are doing some kind of live-reloading during development.
     */
    refresh: () => void;
    /**
     * Convenience wrapper over `.serve` to handle static files in express.js.
     *
     * ```js
     * app.use(staticify.middleware);    // `app` is your express instance
     *  ```
     *
     * @type {RequestHandler}
     * @memberof Statificy
     */
    middleware: RequestHandler;
}

/**
 * Provides helpers to add a version identifier to your static asset's public URLs, and to remove the hash before serving the file from the file system.
 *
 * @export
 * @param {string} root The root path to the static content.
 * @param {StaticifyOptions} [options] Additional options.
 * @returns {Statificy}
 */
export default function staticify(root: string, options?: StaticifyOptions): Statificy;
