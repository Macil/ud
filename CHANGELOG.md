## 3.3.1 (2023-01-23)

* Removed dependency on corejs, which provided polyfills for stuff like WeakMap and other standard JS library features, as it shouldn't be necessary for any even slightly recent browsers. Users targeting very old browsers should bring their own polyfills.

## 3.3.0 (2018-09-03)

* Added [TypeScript](https://www.typescriptlang.org/) type definitions.

## 3.2.0 (2018-05-24)

* Fixed defn compatibility with native ES6 classes.

## 3.1.2 (2018-05-24)

* Fixed defn compatibility with native ES6 arrow functions.
* Updated Flow type definitions for compatibility with Flow 0.72.

## 3.1.1 (2017-07-07)

* Updated Flow type definitions for compatibility with Flow 0.49.1.

## 3.1.0 (2016-09-19)

* Added lightweight "ud/noop" module for non-HMR production builds.

## 3.0.1 (2016-02-12)

* Internal change: automate creation of Flow type definitions file.

## 3.0.0 (2015-12-01)

### Breaking Changes
* [Flow](https://flow.org/) type definitions are now included. This may cause Flow to fail for users who configured Flow with the old recommended configuration.

### Improvements
* Don't require whole lodash module in order to save space in bundle [#1](https://github.com/Macil/ud/pull/1)

## 2.0.2 (2015-10-02)

* Fixed bug where defn did not properly handle functions that returned undefined.

## 2.0.1 (2015-09-04)

* Fixed compatibility issue with updating non-strict-mode functions.

## 2.0.0 (2015-09-04)

### Breaking Changes
* The defobj and defn methods no longer copy inherited properties.

### Improvements
* Made defobj and defn able to remove properties and methods.

## 1.0.4 (2015-08-24)

* Fixed ud to handle classes with static methods.

## 1.0.3 (2015-08-21)

* Fixed ud to handle updating the superclass of a class.

## 1.0.1 (2015-08-20)

* Changed ud to stop relying on function names because they are usually removed by minifiers.

## 1.0.0 (2015-08-20)

Initial release.
