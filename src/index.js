/* @flow */

const range = require('array-range');
const zipObject = require('zip-object');
const moduleUsedUdKeys: WeakMap<typeof module, Set<string>> = new WeakMap();

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
    throw new Error('ud functions can only be used once per module with a given key');
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
function cloneOntoTarget<T: Object>(target: T, object: Object): T {
  Object.getOwnPropertyNames(target)
    .filter(name => !Object.prototype.hasOwnProperty.call(object, name))
    .forEach(name => {
      delete target[name];
    });
  const newPropsChain = Object.getOwnPropertyNames(object);
  Object.defineProperties(
    target,
    zipObject(newPropsChain, newPropsChain
      .map(name => Object.getOwnPropertyDescriptor(object, name))
      .filter(Boolean)
      .map(({value,enumerable}) =>
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
    shared.wrapper = (new Function(
      'shared',
      `
      'use strict';
      return function ${fn.name}__ud_wrapper(${paramsList}) {
        if (new.target) {
          return Reflect.construct(shared.fn, arguments, new.target);
        } else {
          return shared.fn.apply(this, arguments);
        }
      };
      `
    ): any)(shared);
    if (fn.prototype) {
      (shared.wrapper:any).prototype = Object.create(fn.prototype);
      (shared.wrapper:any).prototype.constructor = shared.wrapper;
    } else {
      (shared.wrapper:any).prototype = fn.prototype;
    }
    return shared;
  }, '--defn-shared-'+key);
  shared.fn = fn;
  if ((module:any).hot) {
    if (fn.prototype && (shared.wrapper:any).prototype && Object.getPrototypeOf((shared.wrapper:any).prototype) !== fn.prototype) {
      (Object: any).setPrototypeOf((shared.wrapper:any).prototype, fn.prototype);
    }
    (Object: any).setPrototypeOf(shared.wrapper, fn);
  }
  return shared.wrapper;
}
