/* @flow */
//jshint ignore:start

var _ = require('lodash');
var moduleUsedUdKeys: WeakMap<typeof module, Set<string>> = new WeakMap();
var funcPropBlacklist = ['length', 'name', 'arguments', 'caller', 'prototype'];

export function markReloadable(module: typeof module) {
  if ((module:any).hot) {
    (module:any).hot.accept();
  }
}

export function defonce<T>(module: typeof module, fn: ()=>T, key?:string=''): T {
  markReloadable(module);
  var usedKeys = moduleUsedUdKeys.get(module);
  if (!usedKeys) {
    usedKeys = new Set();
    moduleUsedUdKeys.set(module, usedKeys);
  }
  if (usedKeys.has(key)) {
    throw new Error("ud functions can only be used once per module with a given key");
  }
  usedKeys.add(key);
  var value;
  if ((module:any).hot) {
    if (
      (module:any).hot.data &&
      (module:any).hot.data.__ud__ &&
      Object.prototype.hasOwnProperty.call((module:any).hot.data.__ud__, key)
    ) {
      value = (module:any).hot.data.__ud__[key];
    }
    (module:any).hot.dispose(data => {
      if (!data.__ud__)
        data.__ud__ = {};
      data.__ud__[key] = value;
    });
  }
  if (value === undefined)
    value = fn();
  return value;
}

export function defobj<T: Object>(module: typeof module, object: T, key?:string=''): T {
  var sharedObject = defonce(module, ()=>object, '--defobj-'+key);
  if (sharedObject !== object) {
    Object.defineProperties(
      sharedObject,
      _.chain(Object.getOwnPropertyNames(object))
        .map(name => [name, Object.getOwnPropertyDescriptor(object, name)])
        .map(([name, {value,enumerable}]) =>
          [name, {value,enumerable,writable:true,configurable:true}]
        )
        .zipObject()
        .value()
    );
  }
  return sharedObject;
}

export function defn<T: Function>(module: typeof module, fn: T, key?:string=''): T {
  var shared = defonce(module, ()=>{
    var shared: Object = {fn: null, wrapper: null};
    if (!(module:any).hot) {
      return {fn: null, wrapper: fn};
    } else {
      var paramsList = _.range(fn.length).map(x => 'a'+x).join(',');
      shared.wrapper = new Function(
        'shared',
        `
        return function ${fn.name}__ud_wrapper(${paramsList}){
          return shared.fn.apply(this, arguments);
        };
        `
      )(shared);
      (shared.wrapper:any).prototype = fn.prototype;
      (shared.wrapper:any).prototype.constructor = shared.wrapper;
    }
    return shared;
  }, '--defn-shared-'+key);
  shared.fn = fn;
  if ((module:any).hot) {
    var newSuperProto = Object.getPrototypeOf(fn.prototype);
    fn.prototype = defobj(module, fn.prototype, '--defn-proto-'+key);
    fn.prototype.constructor = shared.wrapper;
    if (Object.getPrototypeOf(fn.prototype) !== newSuperProto) {
      // Hide this line from Flow because it doesn't know setPrototypeOf.
      /*::`*/ Object.setPrototypeOf(fn.prototype, newSuperProto); /*::`;*/
    }
    var newSuperFnProto = Object.getPrototypeOf(fn);
    if (Object.getPrototypeOf(shared.wrapper) !== newSuperFnProto) {
      /*::`*/ Object.setPrototypeOf(shared.wrapper, newSuperFnProto); /*::`;*/
    }
    Object.defineProperties(
      shared.wrapper,
      _.chain(Object.getOwnPropertyNames(fn))
        .filter(name => !_.includes(funcPropBlacklist, name))
        .map(name => [name, Object.getOwnPropertyDescriptor(fn, name)])
        .map(([name, {value,enumerable}]) =>
          [name, {value,enumerable,writable:true,configurable:true}]
        )
        .zipObject()
        .value()
    );
  }
  return shared.wrapper;
}
