# ud

[![Node.js CI](https://github.com/Macil/ud/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/Macil/ud/actions/workflows/node.js.yml) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Macil/ud/blob/master/LICENSE.txt) [![npm version](https://img.shields.io/npm/v/ud.svg?style=flat)](https://www.npmjs.com/package/ud)

Ud is a small set of utilities for updating code live with hot module
replacement, as supported by
[Browserify-HMR](https://github.com/Macil/browserify-hmr) and
[Webpack](https://webpack.github.io/docs/hot-module-replacement.html).

These functions let you accomplish common tasks easily without needing to use
the Hot Module Replacement API directly.

When the `module.hot` API is not available, all of the functions act as simple
pass-throughs.

## API

All of ud's functions require a reference to your local `module` object to be
passed in, and take an optional key. Each of the functions can only be used
once per module with a given key.

### ud.defonce(module, function, key?)

On the first run, the function will be called, and its return value will be
returned. On future reloads, the function will not be called again, and instead
its first return value will be returned again. You can use this to define
values once that must be persisted across reloads.

### ud.defobj(module, object, key?)

On the first run, the object will be returned. On a reload, the original object
will be updated to have all of the values of the newest object and then will be
returned.

### ud.defn(module, function, key?)

A wrapper around the function will be returned which calls the given function.
On a reload, the wrapper will be updated so that it calls the most recent
version of the function.

The prototype of the function will be updated too, so you can pass a class
constructor to defn and have its methods be kept up to date.

## Example

```javascript
var _ = require('lodash');
var ud = require('ud');

var shared = ud.defonce(module, _.constant({counter: 0}));

var inc = ud.defn(module, function() {
  shared.counter += 1;
  console.log('counter', shared.counter);
});

// Function still can be updated even if you export it.
module.exports = inc;
```

The inc function may be updated and will work as expected. If `ud.defonce` were
not used to define the counter object, then each new reload would create a
brand new counter. If `ud.defn` were not used to define the inc function, then
the previously exported function that other modules may have local copies of
would not be updated.

## No-op / Production Builds

For non-HMR builds such as typical production builds, all of ud's functions
will work correctly as they normally do on the first run. However, ud's code
and its dependencies (mostly babel-included polyfills; it adds up to ~50kb,
though if your bundle is already using these same dependencies, such as if you
or your other dependencies are already also using babel-runtime or
babel-polyfill in the bundle, then ud isn't necessarily bringing as much into
the bundle!) may be dead weight that can be safely removed. You can swap out ud
for a simpler no-op implementation by configuring your build process to use the
"ud/noop" module in place of "ud". Here's an example of doing this with
Browserify via the CLI:

    browserify -r ud/noop:ud main.js > bundle.js

## Types

Both [TypeScript](https://www.typescriptlang.org/) and
[Flow](https://flowtype.org/) type definitions for this module are included!
The type definitions won't require any configuration to use.

## See Also

* [ud-kefir](https://github.com/Macil/ud-kefir), a companion library which
  integrates with [Kefir](https://rpominov.github.io/kefir/) and emits events
  when reloads happen.
