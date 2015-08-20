# ud

Ud is a small set of utilities for updating code live with hot module
replacement, as supported by
[Browserify-HMR](https://github.com/AgentME/browserify-hmr) and
[Webpack](https://webpack.github.io/docs/hot-module-replacement.html).

These functions let you accomplish common tasks easily without needing to use
the Hot Module Replacement API directly.

When the `module.hot` API is not available, all of the functions act as simple
pass-throughs.

## API

All of ud's functions require a reference to your local `module` object to be
passed in, and an optional key. Each of the functions can only be used once per
module with a given key.

### ud.defonce(module, function, key?)

On the first run, the function will be called, and its return value will be
returned. On future reloads, the function will not be called again, and instead
its first return value will be returned again. You can use this to define
values once that must be persisted across reloads.

### ud.defobj(module, object, key?)

On the first run, the object will be returned. On a reload, the original object
will be updated to have all of the values of the newest object and then will be
returned.

### ud.defn(module, function)

A wrapper around the function will be returned which calls the given function.
On a reload, the wrapper will be updated so that it calls the most recent
version of the function.

The prototype of the function will be updated too, so you can pass a class
constructor to defn and have its methods be kept up to date. The function name
is used as the key.

## Example

```javascript
var _ = require('lodash');
var ud = require('ud');

var shared = ud.defonce(module, _.constant({counter: 0}));

var inc = ud.defn(module, function inc() {
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

## Types

Full [Flow Type](http://flowtype.org/) declarations for this module are
included. These must be manually enabled to use because Flow [doesn't allow
modules to automatically include their own
declarations](https://github.com/facebook/flow/issues/593) yet.
Add these lines to your `.flowconfig` to enable them:

```
[ignore]
.*/node_modules/ud/.*

[libs]
node_modules/ud/flow-lib.js
```
