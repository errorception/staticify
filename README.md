# staticify

[![NPM version](https://img.shields.io/npm/v/staticify.svg)](https://www.npmjs.com/package/staticify)
[![Linux Build Status](https://img.shields.io/travis/errorception/staticify/master.svg?label=Linux%20build)](https://travis-ci.org/errorception/staticify)
[![Windows Build status](https://img.shields.io/appveyor/ci/rakeshpai/staticify/master.svg?label=Windows%20build)](https://ci.appveyor.com/project/rakeshpai/staticify/branch/master)
[![dependencies Status](https://img.shields.io/david/errorception/staticify.svg)](https://david-dm.org/errorception/staticify)
[![devDependencies Status](https://img.shields.io/david/dev/errorception/staticify.svg)](https://david-dm.org/errorception/staticify?type=dev)

A better static asset handler for Node.js / express.js.

Provides helpers to add a version identifier to your static asset's public URLs, and to remove the hash before serving the file from the file system.

How your URLs are transformed:

```
/home.css --> /home.<md5 hash of contents>.css
```

For example:

```
/home.css --> /home.ae2b1fca515949e5d54fb22b8ed95575.css
/js/script.js --> /js/script.3205c0ded576131ea255ad2bd38b0fb2.js
```

The version hashes are the md5 of the contents of the static asset. Thus, every file has it's own unique version identifier. When a file changes, only it's own hash changes. This lets you have a far-futures expires header for your static assets without worrying about cache-invalidation, while ensuring that the user only downloads the files that have changed since your last deployment.

## With express.js

```js
var path = require('path');
var staticify = require('staticify')(path.join(__dirname, 'public'));

...
app.use(staticify.middleware);

app.helpers({getVersionedPath: staticify.getVersionedPath});
```

And in your template:

```html
<link href="${getVersionedPath('/home.css')}" rel="stylesheet">
```

## Options

### includeAll

Include all files when scanning the public directory. By default, the directories from [ignore-by-default](https://github.com/novemberborn/ignore-by-default/blob/master/index.js) are ignored.

* Type: Boolean
* Default: `false`

### shortHash

Generate a short (7-digit) md5 hash instead of the full (32-digit) one.

* Type: Boolean
* Default: `true`

### sendOptions

* Type: Object
* Default: `sendOptions: { maxAge: '1y' }` for hashed assets or `maxAge: 0` for non-hashed assets.

You can pass any [send](https://github.com/pillarjs/send) options; used in `middleware` and `serve` functions.

## Usage

Install from npm:

```
npm install staticify
```

Initialise the staticify helper with the path of your public directory:

```js
var path = require('path');
var statificy = require('staticify')(path.join(__dirname, 'public'));
```

This returns an object with the following helpers:

### .getVersionedPath(path)

Does the following transformation to the `path`, and returns immediately:

```js
staticify.getVersionedPath('/path/to/file.ext'); // --> /path/to/file.<md5 of the contents of file.ext>.ext
```

This method is meant to be used inside your templates.

This method is really fast (simply an in-memory lookup) and returns immediately. When you initialize this module, it crawls your public folder synchronously at startup, and pre-determines all the md5 hashes for your static files. This slows down application startup slightly, but it keeps the runtime performance at its peak.

### .middleware(req, res, next)

Convenience wrapper over `.serve` to handle static files in express.js.

```js
app.use(staticify.middleware);  // `app` is your express instance
```

### .replacePaths(string)

Takes the input string, and replaces any paths it can understand. For example:

```js
staticify.replacePaths('body { background: url("/index.js") }');
```

returns

```js
"body { background: url('/index.d766c4a983224a3696bc4913b9e47305.js') }"
```

Perfect for use in your build script, to modify references to external paths within your CSS files.

### .stripVersion(path)

Removes the md5 identifier in a path.

```js
staticify.stripVersion('/path/to/file.ae2b1fca515949e5d54fb22b8ed95575.ext'); // --> /path/to/file.ext
```

Note, this function doesn't verify that the hash is valid. It simply finds what looks like a hash and strips it from the path.

### .refresh()

Rebuilds the md5 version cache described above. Use this method sparingly. This crawls your public folder synchronously (in a blocking fashion) to rebuild the cache. This is typically only useful when you are doing some kind of live-reloading during development.

### .serve(req)

Handles an incoming request for the file. Internally calls `.stripVersion` to strip the version identifier, and serves the file with a `maxAge` of one year, using [send](https://github.com/pillarjs/send). Returns a stream that can be `.pipe`d to a http response stream. See [here](https://github.com/pillarjs/send#options) for the options you can pass.

```js
staticify.serve(req, {
    sendOptions: {
        maxAge: 3600 * 1000 // milliseconds
    }
}).pipe(res);
```

## License

MIT
