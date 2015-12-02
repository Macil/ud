/* @flow */
//jshint ignore:start

const range = require('array-range');
const zipObject = require('zip-object');
const moduleUsedUdKeys: WeakMap<typeof module, Set<string>> = new WeakMap();
const funcPropBlacklist = ['length', 'name', 'arguments', 'caller', 'prototype'];

export function markReloadable(module: typeof module) {
  if ((module:any).hot) {
    (module:any).hot.accept();
  }
}

export function defonce<T>(module: typeof module, fn: ()=>T, key?:string=''): T {
  markReloadable(module);
  let usedKeys = moduleUsedUdKeys.get(module);
  if (!usedKeys) {
    usedKeys = new Set();
    moduleUsedUdKeys.set(module, usedKeys);
  }
  if (usedKeys.has(key)) {
    throw new Error("ud functions can only be used once per module with a given key");
  }
  usedKeys.add(key);
  let valueWasSet = false;
  let value: any = undefined;
  if ((module:any).hot) {
    if (
      (module:any).hot.data &&
      (module:any).hot.data.__ud__ &&
      Object.prototype.hasOwnProperty.call((module:any).hot.data.__ud__, key)
    ) {
      value = (module:any).hot.data.__ud__[key];
      valueWasSet = true;
    }
    (module:any).hot.dispose(data => {
      if (!data.__ud__)
        data.__ud__ = {};
      data.__ud__[key] = value;
    });
  }
  if (!valueWasSet)
    value = fn();
  return value;
}

export function defobj<T: Object>(module: typeof module, object: T, key?:string=''): T {
  const sharedObject = defonce(module, ()=>object, '--defobj-'+key);
  if (sharedObject !== object) {
    cloneOntoTarget(sharedObject, object);
  }
  return sharedObject;
}

// Assigns all properties of object onto target, and deletes any properties
// from target that don't exist on object. The optional blacklist argument
// specifies properties to not assign on target.
function cloneOntoTarget<T: Object>(target: T, object: Object, blacklist?: ?string[]): T {
  const cBlacklist = blacklist; // assert to Flow that type refinements stay valid

  let targetPropsChain = Object.getOwnPropertyNames(target);
  if (cBlacklist) {
    targetPropsChain = targetPropsChain.filter(name => cBlacklist.indexOf(name) < 0);
  }
  targetPropsChain
    .filter(name => !Object.prototype.hasOwnProperty.call(object, name))
    .forEach(name => {
      delete target[name];
    });
  let newPropsChain = Object.getOwnPropertyNames(object);
  if (cBlacklist) {
    newPropsChain = newPropsChain.filter(name => cBlacklist.indexOf(name) < 0);
  }
  Object.defineProperties(
    target,
    zipObject(newPropsChain, newPropsChain
      .map(name => [name, Object.getOwnPropertyDescriptor(object, name)])
      .map(([name, {value,enumerable}]) =>
        ({value,enumerable,writable:true,configurable:true})
      )
    )
  );
  return target;
}

export function defn<T: Function>(module: typeof module, fn: T, key?:string=''): T {
  const shared = defonce(module, ()=>{
    if (!(module:any).hot) {
      return {fn: (null: ?T), wrapper: fn};
    }
    const shared: Object = {fn: null, wrapper: null};
    const paramsList = range(fn.length).map(x => 'a'+x).join(',');
    shared.wrapper = new Function(
      'shared',
      `
      'use strict';
      return function ${fn.name}__ud_wrapper(${paramsList}){
        return shared.fn.apply(this, arguments);
      };
      `
    )(shared);
    (shared.wrapper:any).prototype = fn.prototype;
    (shared.wrapper:any).prototype.constructor = shared.wrapper;
    return shared;
  }, '--defn-shared-'+key);
  shared.fn = fn;
  if ((module:any).hot) {
    const newSuperProto = Object.getPrototypeOf(fn.prototype);
    fn.prototype = defobj(module, fn.prototype, '--defn-proto-'+key);
    fn.prototype.constructor = shared.wrapper;
    if (Object.getPrototypeOf(fn.prototype) !== newSuperProto) {
      // Hide this line from Flow because it doesn't know setPrototypeOf.
      /*::`*/ Object.setPrototypeOf(fn.prototype, newSuperProto); /*::`;*/
    }
    const newSuperFnProto = Object.getPrototypeOf(fn);
    if (Object.getPrototypeOf(shared.wrapper) !== newSuperFnProto) {
      /*::`*/ Object.setPrototypeOf(shared.wrapper, newSuperFnProto); /*::`;*/
    }
    cloneOntoTarget(shared.wrapper, fn, funcPropBlacklist);
  }
  return shared.wrapper;
}
