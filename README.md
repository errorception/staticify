staticify
===

A better static asset handler for node.js / express.js

Provides helpers to add a version identifier to your static asset's public URLs, and to remove the hash before serving the file from the file system.

This allows us to set a far-futures expires headers for static assets.

Use with express.js
---

```javascript
var staticify = require("staticify")(path.join(__dirname, "public"));

...
app.use(staticify.middleware);

app.helpers({getVersionedPath: staticify.getVersionedPath});
```

And in your template:

```html
<link href="${getVersionedPath("/home.css")}" rel="stylesheet">
```

How your URLs are transformed:

```
/home.css --> /home.<md5 hash of contents>.css
```

For example:

```
/home.css --> /home.ae2b1fca515949e5d54fb22b8ed95575.css
/js/script.js --> /js/script.3205c0ded576131ea255ad2bd38b0fb2.js
```

Usage
---

Initialise the statificy helper with the path of your public directory:

```javascript
var statificy = require("staticify")(path.join(__dirname, "public"));
```

This returns an object with the following helpers:

### .getVersionedPath(path)

Does the following transformation to the `path`, and returns immediately:
```javascript
staticify.getVersionedPath('/path/to/file.ext'); // --> /path/to/file.<md5 of the contents of file.ext>.ext
```

### .stripVersion(path)

Does the opposite of the above method:

```javascript
staticify.stripVersion('/path/to/file.ae2b1fca515949e5d54fb22b8ed95575.ext'); // --> /path/to/file.ext
```

Both of the above methods are really fast (simply an in-memory lookup). This module crawls your public folder synchronously at startup, and pre-determines all the md5 hashes for your files. This slows down application startup slightly, but it keeps the runtime performance at its peak. This cache should be considered internal to this module, but can be viewed by looking at the `._versions` property.

### .refresh()

Rebuilds the version cache described above. Use this method sparingly. This crawls your public folder synchronously (in a blocking fashion) to rebuild the internal md5 cache. This is typically only useful when you are doing any kind of live-reloading during development.

### .serve(req)

Handles an incoming request for the file. Internally calls `.stripVersion` to strip the version identifier, and serves the file with a `maxage` of a year, using [send](https://github.com/tj/send).

### .middleware(req, res, next)

Convenience wrapper over `.send` to handle static files in express.js.

License
---
MIT