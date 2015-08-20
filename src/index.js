/* @flow */
//jshint ignore:start

var _ = require('lodash');
var moduleUsedUdKeys: WeakMap<typeof module, Set<string>> = new WeakMap();

export function markReloadable(module: typeof module) {
  if ((module:any).hot) {
    (module:any).hot.accept();
  }
}

export function defonce<T>(module: typeof module, fn: ()=>T, key:string='-default-once'): T {
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

export function defobj<T: Object>(module: typeof module, object: T, key:string='-default-obj'): T {
  var sharedObject = defonce(module, ()=>object, key);
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

export function defn<T: Function>(module: typeof module, fn: T): T {
  var updatable = defobj(module, {fn}, '-fn-'+fn.name);
  if ((module:any).hot) {
    var paramsList = _.range(fn.length).map(x => 'a'+x).join(',');
    var wrappedFn: any = new Function(
      'updatable',
      `
      var wrapper = function ${fn.name}__ud_wrapper(${paramsList}){
        if (this instanceof wrapper) {
          var obj = Object.create(updatable.fn.prototype);
          obj.constructor = wrapper;
          var retval = updatable.fn.apply(obj, arguments);
          if (typeof retval === 'object') {
            obj = retval;
          }
          return obj;
        }
        return updatable.fn.apply(this, arguments);
      };
      return wrapper;
      `
    )(updatable);

    var updatableProto = defobj(module, fn.prototype, '-fn-proto-'+fn.name);
    wrappedFn.prototype = updatable.fn.prototype = updatableProto;
    return wrappedFn;
  }
  return fn;
}
